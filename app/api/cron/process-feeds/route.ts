import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

const parser = new Parser();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== 'sift-cron-8a7f3b2c-4e1d-4f6a-9c3e-2b7a5d1f0e8c') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: feeds, error } = await supabaseAdmin
    .from('sift_feeds')
    .select('id, user_id, feed_url');

  if (error || !feeds || feeds.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.feed_url, {
        headers: { 'User-Agent': 'SiftBot/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;

      const xml = await res.text();
      const parsed = await parser.parseString(xml);

      if (!parsed.items?.length) continue;

      // Only the very newest item
      const item = parsed.items[0];
      const link = item.link;
      if (!link) continue;

      const { data: existing } = await supabaseAdmin
        .from('sifted_articles')
        .select('id')
        .eq('source_url', link)
        .eq('user_id', feed.user_id)
        .maybeSingle();

      if (existing) continue;

      try {
        const siftRes = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thesift.space'}/api/sift`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: link }),
          }
        );

        if (!siftRes.ok) continue;

        const siftData = await siftRes.json();
        if (siftData.error) continue;

        console.log('Inserting sifted article:', {
          user_id: feed.user_id,
          source_url: link,
          summary: siftData.summary?.substring(0, 50),
          verdict: siftData.verdict,
        });

        const { error: insertError } = await supabaseAdmin.from('sifted_articles').insert({
          user_id: feed.user_id,
          source_url: link,
          summary: siftData.summary,
          insight: siftData.insight,
          verdict: siftData.verdict,
          kept: true,
          feed: feed.id,
          reading_time: siftData.readingTime,
          thumbnail_url: siftData.thumbnailUrl,
          full_text: siftData.fullText,
        });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          processed++;
        }

        // Wait 8 seconds between feeds to keep Groq happy
        await wait(8000);
      } catch (siftError) {
        console.error(`Sift failed for ${link}:`, siftError);
      }
    } catch (feedError) {
      console.error(`Failed to process feed ${feed.feed_url}:`, feedError);
    }
  }

  return NextResponse.json({ processed });
}