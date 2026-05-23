import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type CollectionRow = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  user_id: string;
  user_profiles: { username: string } | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = await createClient();

  const { data: collection, error: colError } = await supabase
    .from('public_collections')
    .select('id, title, description, cover_url, created_at, user_id, user_profiles!user_id(username)')
    .eq('id', id)
    .single();

  if (colError || !collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

  const typedCollection = collection as unknown as CollectionRow;

  const { data: articles, error: artError } = await supabase
    .from('collection_articles')
    .select('article:sifted_articles(id, summary, verdict, source_url, thumbnail_url)')
    .eq('collection_id', id)
    .order('added_at', { ascending: false });

  if (artError) return NextResponse.json({ error: artError.message }, { status: 500 });

  return NextResponse.json({
    collection: {
      id: typedCollection.id,
      title: typedCollection.title,
      description: typedCollection.description,
      cover_url: typedCollection.cover_url,
      created_at: typedCollection.created_at,
      curator: typedCollection.user_profiles?.username || 'unknown',
    },
    articles: articles?.map(a => a.article) || [],
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, articleIds } = await request.json();
  if (!title || !articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
    return NextResponse.json({ error: 'Title and at least one article are required' }, { status: 400 });
  }

  const { data: collection, error: insertError } = await supabase
    .from('public_collections')
    .insert({ title, description: description || '', user_id: user.id })
    .select('id')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const { error: linkError } = await supabase
    .from('collection_articles')
    .insert(articleIds.map((articleId: string) => ({
      collection_id: collection.id,
      article_id: articleId,
    })));

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  return NextResponse.json({ success: true, id: collection.id });
}