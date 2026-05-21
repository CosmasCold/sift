import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert(
            {
              id: user.id,
              email: user.email,
              tier: 'free',
              analyses_today: 0,
              last_analysis_date: new Date().toISOString().split('T')[0],
            },
            { onConflict: 'id' }
          );
      }
    }
  }

  // This redirects to the homepage of the origin that made the request
  // e.g., http://localhost:3000 (Sift) or https://sift.pauseapp.space
  return NextResponse.redirect(requestUrl.origin);
}