import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const POCKET_CONSUMER_KEY = process.env.POCKET_CONSUMER_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestToken = searchParams.get('code'); // Pocket returns the request token here
  const userId = searchParams.get('user');

  if (!requestToken || !userId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  // Exchange for access token
  const res = await fetch('https://getpocket.com/v3/oauth/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumer_key: POCKET_CONSUMER_KEY,
      code: requestToken,
    }),
  });
  const data = await res.json();

  if (data.access_token) {
    const supabase = await createClient();
    await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        integration: 'pocket',
        access_token: data.access_token,
        username: data.username,
      });

    return NextResponse.redirect(new URL('/settings?integrated=pocket', request.url));
  }

  return NextResponse.redirect(new URL('/settings?error=pocket_failed', request.url));
}