import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const POCKET_CONSUMER_KEY = process.env.POCKET_CONSUMER_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Step 1: Obtain request token
  const res = await fetch('https://getpocket.com/v3/oauth/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumer_key: POCKET_CONSUMER_KEY,
      redirect_uri: `${BASE_URL}/api/integrations/pocket/callback`,
    }),
  });
  const code = (await res.json()).code;

  // Step 2: Redirect user to Pocket authorization page
  const authorizeUrl = `https://getpocket.com/auth/authorize?request_token=${code}&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/integrations/pocket/callback?user=${user.id}`)}`;

  return NextResponse.redirect(authorizeUrl);
}