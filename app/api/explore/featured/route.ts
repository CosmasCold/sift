import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  // Get top 4 public users – must include id
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, username, avatar_url')
    .eq('public_profile', true)
    .limit(4);

  if (error || !profiles) {
    return NextResponse.json({ profiles: [] });
  }

  const result = [];
  for (const p of profiles) {
    const { count } = await supabase
      .from('sifted_articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', p.id)
      .eq('kept', true);

    result.push({
      username: p.username,
      avatar_url: p.avatar_url,
      articlesKept: count || 0,
    });
  }

  return NextResponse.json({ profiles: result });
}