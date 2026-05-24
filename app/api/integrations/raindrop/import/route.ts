import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get Raindrop token
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('integration', 'raindrop')
    .single();

  if (!integration?.access_token) {
    return NextResponse.json({ error: 'Raindrop token not configured' }, { status: 400 });
  }

  // Fetch Raindrop bookmarks
  let imported = 0;
  let page = 0;
  const perPage = 50;
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.raindrop.io/rest/v1/raindrops/${page}?perpage=${perPage}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${integration.access_token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Raindrop API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const items = data.items || [];
    hasMore = items.length === perPage;

    for (const item of items) {
      const link = item.link;
      if (!link) continue;

      // Check if already queued
      const { data: existing } = await supabase
        .from('queued_articles')
        .select('id')
        .eq('url', link)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) continue;

      await supabase.from('queued_articles').insert({ user_id: user.id, url: link });
      imported++;
    }

    page++;
  }

  return NextResponse.json({ imported });
}