import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const POCKET_CONSUMER_KEY = process.env.POCKET_CONSUMER_KEY!;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get Pocket access token
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('integration', 'pocket')
    .single();

  if (!integration) return NextResponse.json({ error: 'Pocket not connected' }, { status: 400 });

  // Fetch Pocket list
  const res = await fetch('https://getpocket.com/v3/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumer_key: POCKET_CONSUMER_KEY,
      access_token: integration.access_token,
      count: 100,
      detailType: 'simple',
    }),
  });
  const data = await res.json();

  if (data.error) return NextResponse.json({ error: data.error }, { status: 500 });

  let imported = 0;
  for (const id in data.list) {
    const item = data.list[id];
    const url = item.resolved_url || item.given_url;
    if (!url) continue;

    // Add to queue (or sift immediately)
    await supabase.from('queued_articles').insert({ user_id: user.id, url });
    imported++;
  }

  return NextResponse.json({ imported });
}