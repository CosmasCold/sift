import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collectionId = searchParams.get('collectionId');
  const username = searchParams.get('username');

  const supabase = await createClient();

  // If collectionId provided, return star count and whether current user has starred
  if (collectionId) {
    const { count, error: countError } = await supabase
      .from('collection_stars')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    let isStarred = false;
    if (user) {
      const { data } = await supabase
        .from('collection_stars')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('user_id', user.id)
        .maybeSingle();
      isStarred = !!data;
    }

    return NextResponse.json({ count: count || 0, isStarred });
  }

  // If username provided, return collections that user has starred
  if (username) {
    // Get user ID from username
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: stars } = await supabase
      .from('collection_stars')
      .select('collection_id, public_collections(id, title, description, cover_url, created_at)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    const collections = (stars || []).map(s => s.public_collections).filter(Boolean);
    return NextResponse.json({ collections });
  }

  return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { collectionId } = await request.json();
  if (!collectionId) return NextResponse.json({ error: 'Missing collectionId' }, { status: 400 });

  // Check if already starred
  const { data: existing } = await supabase
    .from('collection_stars')
    .select('*')
    .eq('user_id', user.id)
    .eq('collection_id', collectionId)
    .maybeSingle();

  if (existing) {
    // Unstar
    await supabase
      .from('collection_stars')
      .delete()
      .eq('user_id', user.id)
      .eq('collection_id', collectionId);
    return NextResponse.json({ starred: false });
  } else {
    // Star
    await supabase
      .from('collection_stars')
      .insert({ user_id: user.id, collection_id: collectionId });
    return NextResponse.json({ starred: true });
  }
}