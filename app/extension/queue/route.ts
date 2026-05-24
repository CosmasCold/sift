import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.redirect(new URL('/?error=missing_url', request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in – redirect to auth, they can queue after signing in
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Add to queue
  await supabase
    .from('queued_articles')
    .insert({ user_id: user.id, url });

  return NextResponse.redirect(new URL('/queue?added=1', request.url));
}