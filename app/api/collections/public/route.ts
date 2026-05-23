import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type CollectionRow = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  user_id: string;
  user_profiles: { username: string } | null;
};

export async function GET() {
  const supabase = await createClient();

  const { data: collections, error } = await supabase
    .from('public_collections')
    .select('id, title, description, cover_url, created_at, user_id, user_profiles!user_id(username)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = ((collections || []) as unknown as CollectionRow[]).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    cover_url: c.cover_url,
    created_at: c.created_at,
    curator: c.user_profiles?.username || 'unknown',
  }));

  return NextResponse.json({ collections: result });
}