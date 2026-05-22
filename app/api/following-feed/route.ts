import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Get list of users the current user follows
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followedIds = follows?.map(f => f.following_id) || [];
  if (followedIds.length === 0) return NextResponse.json({ articles: [] });

  // 2. Fetch kept articles from those users, join with user_profiles for username
  const { data: articles, error } = await supabase
    .from('sifted_articles')
    .select(`
      id,
      summary,
      verdict,
      created_at,
      source_url,
      user_id,
      user_profiles!user_id(username, avatar_url)
    `)
    .in('user_id', followedIds)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ articles: articles || [] });
}