import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Parser from 'rss-parser';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app';
  const { data: feeds } = await supabase.from('sift_feeds').select('*');

  if (!feeds?.length) return NextResponse.json({ message: 'No feeds' });

  let newCount = 0;
  for (const feed of feeds) {
    try {
      const parser = new Parser();
      const parsed = await parser.parseURL(feed.feed_url);
      const items = parsed.items.slice(0, 1); // adjust batch size later

      for (const item of items) {
        const url = item.link;
        if (!url) continue;

        const { count } = await supabase
          .from('sifted_articles')
          .select('*', { count: 'exact', head: true })
          .eq('source_url', url)
          .eq('user_id', feed.user_id);
        if (count) continue;

        // Use the existing retry function or call /api/sift directly
        const siftRes = await fetch(`${baseUrl}/api/sift`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const siftData = await siftRes.json();
        if (siftData.summary) {
          const { error } = await supabase.from('sifted_articles').insert({
            user_id: feed.user_id,
            source_url: url,
            summary: siftData.summary,
            insight: siftData.insight || '',
            verdict: siftData.verdict || 'Skim this',
            kept: siftData.verdict !== 'You can skip this',
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