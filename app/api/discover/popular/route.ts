import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // Count how many users follow each feed, get the top 10
  const { data, error } = await supabase
    .from('sift_feeds')
    .select('feed_url, title');

  if (error || !data) {
    return NextResponse.json({ feeds: [] });
  }

  // Aggregate counts in JS (since we can't easily GROUP BY on JSON)
  const counts: Record<string, { title: string | null; count: number }> = {};
  for (const row of data) {
    const url = row.feed_url;
    if (!counts[url]) {
      counts[url] = { title: row.title, count: 0 };
    }
    counts[url].count++;
  }

  const sorted = Object.entries(counts)
    .map(([url, info]) => ({
      url,
      title: info.title || url,
      followers: info.count,
    }))
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 10);

  return NextResponse.json({ feeds: sorted });
}