import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Parser from 'rss-parser';

async function siftWithRetry(url: string, baseUrl: string, retries = 3): Promise<Record<string, unknown>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    try {
      const res = await fetch(`${baseUrl}/api/sift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      console.log(`Attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
      if (attempt === retries) break;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1))); // 1s, 2s, 4s
    }
  }
  throw lastError;
}

export async function GET() {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const { data: feeds } = await supabase.from('sift_feeds').select('*');

  if (!feeds?.length) return NextResponse.json({ message: 'No feeds' });

  let newCount = 0;
  for (const feed of feeds) {
    try {
      const parser = new Parser();
      const parsed = await parser.parseURL(feed.feed_url);
      const items = parsed.items.slice(0, 5); // process 1 article per feed for now

      for (const item of items) {
        const url = item.link;
        if (!url) continue;

        const { count } = await supabase
          .from('sifted_articles')
          .select('*', { count: 'exact', head: true })
          .eq('source_url', url)
          .eq('user_id', feed.user_id);
        if (count) continue;

        const siftData = await siftWithRetry(url, baseUrl);
        if (siftData.summary) {
          const { error } = await supabase.from('sifted_articles').insert({
            user_id: feed.user_id,
            source_url: url,
            summary: siftData.summary as string,
            insight: (siftData.insight as string) || '',
            verdict: (siftData.verdict as string) || 'Skim this',
            kept: (siftData.verdict as string) !== 'You can skip this',
            feed_id: feed.id,
          });
          if (!error) newCount++;
        }
      }
    } catch (err) {
      console.error('Feed error:', feed.feed_url, err);
    }
  }
  return NextResponse.json({ message: `Processed. New articles: ${newCount}` });
}