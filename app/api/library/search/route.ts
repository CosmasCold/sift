import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ articles: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use Postgres full‑text search via Supabase's textSearch
  // Fallback: use ilike for a quick implementation
  const { data: articles, error } = await supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at, tags, source_url, thumbnail_url, reading_time, feed:sift_feeds(id, title)')
    .eq('user_id', user.id)
    .or(`summary.ilike.%${query}%,full_text.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map feed array to single object if needed
  const result = (articles || []).map(a => ({
    ...a,
    feed: a.feed || null,
    tags: a.tags || [],
  }));

  return NextResponse.json({ articles: result });
}