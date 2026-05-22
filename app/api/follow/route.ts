import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { followingId } = await request.json();
  if (!followingId) return NextResponse.json({ error: 'Missing followingId' }, { status: 400 });

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single();

  if (existing) {
    // Unfollow
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);
    return NextResponse.json({ following: false });
  } else {
    // Follow
    await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: followingId });
    return NextResponse.json({ following: true });
  }
}