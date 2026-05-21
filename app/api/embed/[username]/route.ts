import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, public_profile')
    .eq('username', username)
    .maybeSingle();

  if (!profile || !profile.public_profile) {
    return NextResponse.json({ error: 'Profile not public' }, { status: 404 });
  }

  const { data: articles } = await supabase
    .from('sifted_articles')
    .select('summary, verdict, created_at')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ articles: articles || [] });
}