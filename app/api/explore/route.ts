import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.trim();

  const supabase = await createClient();

  // If no query, return empty array
  if (!q || q.length < 2) {
    return NextResponse.json({ profiles: [] });
  }

  // Search for public profiles with username matching query
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