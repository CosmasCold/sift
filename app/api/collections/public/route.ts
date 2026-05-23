import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: collections, error } = await supabase
      .from('public_collections')
      .select('id, title, description, cover_url, created_at, user_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Collections fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch usernames separately to avoid join issues
    const userIds = [...new Set(collections?.map(c => c.user_id) || [])];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

    const result = (collections || []).map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      cover_url: c.cover_url,
      created_at: c.created_at,
      curator: profileMap.get(c.user_id) || 'unknown',
    }));

    return NextResponse.json({ collections: result });
  } catch (err) {
    console.error('Collections API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}