import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { isUrlBlocked, hasBlockedKeywords } from '@/lib/blocklist';

interface FeedbackRow {
  summary: string | null;
  verdict: string;
  feedback: string;
}

export const maxDuration = 60;

const GROQ_API_KEY = process.env.GROQ_API_KEY!;

const BASE_PROMPT = `You are Sift, a personalised reading assistant. You receive the full text of an article and, when available, examples of the user's past feedback. Use the feedback to calibrate your verdict. Return a JSON object with:

- summary: a one-paragraph plain‑English summary
- insight: the single most useful or surprising sentence in the article, quoted exactly (empty string if nothing stands out)
- verdict: "Worth a full read", "Skim this", or "You can skip this"

Return ONLY valid JSON. No markdown, no extra text.`;

export async function POST(request: NextRequest) {
  try {
    const { url, manualText } = await request.json();

    // --------------------------------------------------
    // 1. Get the current user (if signed in) and their feedback history
    // --------------------------------------------------
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Rate limit: 10 sifts per 60 seconds per user (or IP)
    const key = user?.id ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const limitResponse = rateLimit(key, 10, 60_000);
    if (limitResponse) return limitResponse;

    // ---- Domain blocklist (for URLs) ----
    if (url && isUrlBlocked(url)) {
      return NextResponse.json(
        { error: 'This content is not supported.' },
        { status: 400 }
      );
    }

    // ---- Keyword blocklist (for manually pasted text) ----
    if (manualText && hasBlockedKeywords(manualText)) {
      return NextResponse.json(
        { error: 'This content is not supported.' },
        { status: 400 }
      );
    }

    let articleText = manualText?.trim();
    let thumbnailUrl: string | null = null;
    let feedbackContext = '';

    if (user) {
      const { data: feedbackData } = await supabase
        .from('sifted_articles')
        .select('summary, verdict, feedback, source_url')
        .eq('user_id', user.id)
        .not('feedback', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (feedbackData && feedbackData.length > 0) {
        const examples = feedbackData
          .map(
            (row: FeedbackRow) =>
              `- Summary: "${row.summary?.substring(0, 200)}" | Verdict: "${row.verdict}" | User feedback: "${row.feedback}"`
          )
          .join('\n');
        feedbackContext = `\nThe user has given the following feedback on past articles:\n${examples}\nUse these preferences to adjust your verdict. If the user consistently disagreed with "Worth a full read" on long articles, prefer "Skim this" for similar content.`;
      }
    }

    // --------------------------------------------------
    // 2. Fetch article text (or use manual paste) and extract OG image
    // --------------------------------------------------
    if (!articleText) {
      if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }

      let html: string;
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        html = await res.text();
      } catch (fetchError: unknown) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Unknown error';
        console.error('Fetch error:', message);
        return NextResponse.json(
          {
            error: 'Could not fetch that article. You can paste the text manually.',
            needsManualFallback: true,
          },
          { status: 400 }
        );
      }

      const $ = cheerio.load(html);

      // ---- Extract OG image ----
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        thumbnailUrl = ogImage.startsWith('http') ? ogImage : new URL(ogImage, url).href;
      }

      $('script, style, nav, footer, header, aside, .sidebar, .comments, noscript').remove();

      const selectors = [
        'article',
        '[role="main"]',
        'main',
        '.post-content',
        '.article-body',
        '.entry-content',
      ];
      for (const selector of selectors) {
        const el = $(selector);
        if (el.length > 0) {
          articleText = el.text();
          break;
        }
      }
      if (!articleText) articleText = $('body').text();

      articleText = articleText.replace(/\s+/g, ' ').trim();
      console.log('Extracted text length:', articleText.length);

      if (articleText.length < 100) {
        return NextResponse.json(
          {
            error: 'Not enough text could be extracted from that page. You can paste the text manually.',
            needsManualFallback: true,
          },
          { status: 400 }
        );
      }

      // ---- Keyword blocklist (for scraped text) ----
      if (hasBlockedKeywords(articleText)) {
        return NextResponse.json(
          { error: 'This content is not supported.' },
          { status: 400 }
        );
      }

      articleText = articleText.substring(0, 4000);
    }

    // --------------------------------------------------
    // 3. Calculate reading time
    // --------------------------------------------------
    const wordCount = articleText.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // --------------------------------------------------
    // 4. Call Groq
    // --------------------------------------------------
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const systemMessage = feedbackContext
      ? `${BASE_PROMPT}\n${feedbackContext}`
      : BASE_PROMPT;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: articleText },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // ---- AI safety flag: if the model refused to generate (empty or error) ----
    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: 'This content could not be processed.' },
        { status: 400 }
      );
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\n?|```/g, '').trim();
      try {
        result = JSON.parse(cleaned);
      } catch {
        return NextResponse.json(
          { error: 'This content could not be processed.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      ...result,
      sourceUrl: url,
      readingTime,
      thumbnailUrl,
      fullText: articleText,
    });
  } catch (error) {
    console.error('Sift error:', error);
    return NextResponse.json(
      { error: 'Something unexpected happened. Please try again.' },
      { status: 500 }
    );
  }
}