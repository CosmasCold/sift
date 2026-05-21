import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app';

  // Fetch all feeds (service role bypasses RLS)
  const { data: feeds, error } = await supabase.from('sift_feeds').select('*');
  if (error) {
    console.error('Error fetching feeds:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!feeds || feeds.length === 0) {
    return NextResponse.json({ message: 'No feeds' });
  }

  let newCount = 0;

  for (const feed of feeds) {
    try {
      const parser = new Parser();
      const parsed = await parser.parseURL(feed.feed_url);
      const items = parsed.items.slice(0, 3); // process up to 3 per feed

      for (const item of items) {
        const url = item.link;
        if (!url) continue;

        // Check if already sifted (use service role)
        const { count, error: countError } = await supabase
          .from('sifted_articles')
          .select('*', { count: 'exact', head: true })
          .eq('source_url', url)
          .eq('user_id', feed.user_id);

        if (countError) {
          console.error('Count error:', countError);
          continue;
        }
        if (count && count > 0) continue;

        // Call sift API
        const siftRes = await fetch(`${baseUrl}/api/sift`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const siftData = await siftRes.json();
        if (siftData.summary) {
          const { error: insertError } = await supabase.from('sifted_articles').insert({
            user_id: feed.user_id,
            source_url: url,
            summary: siftData.summary,
            insight: siftData.insight || '',
            verdict: siftData.verdict || 'Skim this',
            kept: siftData.verdict !== 'You can skip this',
            feed_id: feed.id,
          });
          if (insertError) {
            console.error('Insert error:', insertError);
          } else {
            newCount++;
          }
        }
      }
    } catch (err) {
      console.error('Feed error:', feed.feed_url, err);
    }
  }

  return NextResponse.json({ message: `Processed. New articles: ${newCount}` });
}