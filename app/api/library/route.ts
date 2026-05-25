import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Query parameters ---
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = Number(searchParams.get('offset')) || 0;
  const filter = searchParams.get('filter') || 'kept';   // kept | discarded | all
  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';
  const collectionTitle = searchParams.get('collection') || '';
  const feedId = searchParams.get('feed') || '';

  // --- Build query ---
  let query = supabase
    .from('sifted_articles')
    .select('id, url, source_url, summary, insight, verdict, feedback, kept, created_at, tags, reading_time, thumbnail_url, feed:sift_feeds!sifted_articles_feed_fkey(id, title)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filter === 'kept') {
    query = query.eq('kept', true);
  } else if (filter === 'discarded') {
    query = query.eq('kept', false);
  }

  if (search.trim()) {
    query = query.ilike('summary', `%${search.trim()}%`);
  }

  if (tag.trim()) {
    query = query.contains('tags', [tag.trim()]);
  }

  if (feedId && feedId !== 'all') {
    query = query.eq('feed', feedId);
  }

  // Collection filtering is done client‑side after fetching all IDs – we skip it here for simplicity.
  // We’ll handle it by fetching the collection article IDs separately and passing them as a filter,
  // but that’s a second query. For now, we return all articles and let the client filter.

  // Pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Library API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const articles = (data || []).map(article => ({
    ...article,
    feed: article.feed || null,
    tags: article.tags || [],
  }));

  return NextResponse.json({
    articles,
    total: count || 0,
    hasMore: (offset + limit) < (count || 0),
  });
}