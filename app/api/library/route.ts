import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch articles with feed data, tags, and reading_time
  const { data, error } = await supabase
    .from('sifted_articles')
    .select(`
  id,
  url,
  source_url,
  summary,
  insight,
  verdict,
  feedback,
  kept,
  created_at,
  tags,
  reading_time,
  thumbnail_url,
  feed:sift_feeds!sifted_articles_feed_fkey(id, title)
`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Library API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ensure feed is always an object or null
  const articles = data?.map(article => ({
    ...article,
    feed: article.feed || null,
    tags: article.tags || []
  })) || [];

  return NextResponse.json({ articles });
}