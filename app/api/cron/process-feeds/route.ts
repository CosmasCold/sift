import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

const parser = new Parser();

export async function GET() {
  const supabase = await createClient();

  // Get all feeds from all users
  const { data: feeds, error } = await supabase
    .from('sift_feeds')
    .select('id, user_id, feed_url');

  if (error || !feeds) {
    return NextResponse.json({ error: 'No feeds found' }, { status: 500 });
  }

  let processed = 0;
  for (const feed of feeds) {
    try {
      const res = await fetch(feed.feed_url, {
        headers: { 'User-Agent': 'SiftBot/1.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = await parser.parseString(xml);

      if (parsed.items?.length) {
        for (const item of parsed.items.slice(0, 5)) {
          const link = item.link;
          if (!link) continue;

          // Skip if already sifted by this user
          const { data: existing } = await supabase
            .from('sifted_articles')
            .select('id')
            .eq('source_url', link)
            .eq('user_id', feed.user_id)
            .maybeSingle();

          if (existing) continue;

          // Trigger sift for this URL (using the existing sift API logic)
          try {
            const siftRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app'}/api/sift`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: link }),
            });
            if (siftRes.ok) {
              const data = await siftRes.json();
              // Save directly
              await supabase.from('sifted_articles').insert({
                user_id: feed.user_id,
                source_url: link,
                summary: data.summary,
                insight: data.insight,
                verdict: data.verdict,
                kept: true,
                feed: feed.id,
                reading_time: data.readingTime,
                thumbnail_url: data.thumbnailUrl,
                full_text: data.fullText,
              });
              processed++;
            }
          } catch (siftError) {
            console.error(`Sift failed for ${link}:`, siftError);
          }
        }
      }
    } catch (feedError) {
      console.error(`Failed to process feed ${feed.feed_url}:`, feedError);
      // Continue with other feeds
    }
  }

  return NextResponse.json({ processed });
}