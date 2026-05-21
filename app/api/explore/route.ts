import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.trim().toLowerCase();
  const tag = searchParams.get('tag')?.trim().toLowerCase();

  const supabase = await createClient();

  // If searching by tag
  if (tag && tag.length > 0) {
    // Find distinct user_ids from sifted_articles that have the tag in tags array, are kept, and user has public profile
    const { data: articles, error } = await supabase
      .from('sifted_articles')
      .select('user_id')
      .contains('tags', [tag])
      .eq('kept', true)
      .limit(100);

    if (error) {
      console.error('Tag search error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    const userIds = [...new Set(articles.map(a => a.user_id))];

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('username, avatar_url, created_at')
      .in('id', userIds)
      .eq('public_profile', true)
      .order('username', { ascending: true });

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: profiles || [] });
  }

  // Otherwise, search by username (existing functionality)
  if (!q || q.length < 2) {
    return NextResponse.json({ profiles: [] });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('username, avatar_url, created_at')
    .eq('public_profile', true)
    .ilike('username', `%${q}%`)
    .order('username', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Explore search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data || [] });
}