import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  const supabase = await createClient();

  // Get the target user's profile and their tags
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, username')
    .eq('username', username)
    .eq('public_profile', true)
    .single();

  if (profileError || !profile) return NextResponse.json({ profiles: [] });

  // Get the tags of the target user from kept articles
  const { data: targetArticles } = await supabase
    .from('sifted_articles')
    .select('tags')
    .eq('user_id', profile.id)
    .eq('kept', true);

  const targetTags = new Set(
    (targetArticles || []).flatMap(a => a.tags || [])
  );
  const targetTagArray = Array.from(targetTags);

  if (targetTagArray.length === 0) return NextResponse.json({ profiles: [] });

  // Find other public users who share at least 2 tags
  const { data: potentialUsers } = await supabase
    .from('user_profiles')
    .select('id, username, avatar_url')
    .eq('public_profile', true)
    .neq('id', profile.id)
    .limit(50);

  // For each potential user, fetch their tags and compute overlap
  const results: { username: string; avatar_url: string | null; commonTags: string[] }[] = [];

  for (const otherUser of potentialUsers || []) {
    const { data: otherArticles } = await supabase
      .from('sifted_articles')
      .select('tags')
      .eq('user_id', otherUser.id)
      .eq('kept', true);

    const otherTags = new Set(
      (otherArticles || []).flatMap(a => a.tags || [])
    );

    const commonTags = targetTagArray.filter(tag => otherTags.has(tag));
    if (commonTags.length >= 2) {
      results.push({
        username: otherUser.username,
        avatar_url: otherUser.avatar_url,
        commonTags: commonTags.slice(0, 3), // show up to 3 shared tags
      });
    }
  }

  // Sort by most common tags, then take top 4
  results.sort((a, b) => b.commonTags.length - a.commonTags.length);
  return NextResponse.json({ profiles: results.slice(0, 4) });
}