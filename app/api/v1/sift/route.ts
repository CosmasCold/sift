import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 });
  }
  const key = authHeader.slice(7).trim();
  if (!key) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const supabase = await createClient();

  // Find user by API key
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('api_key', key)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL field is required' }, { status: 400 });
  }

  // If ?sift=now is set, sift immediately; otherwise queue
  const siftNow = request.nextUrl.searchParams.get('sift') === 'now';

  if (siftNow) {
    // Call the internal sift endpoint
    const siftRes = await fetch(`${request.nextUrl.origin}/api/sift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const siftData = await siftRes.json();
    if (siftData.error) {
      return NextResponse.json({ error: siftData.error }, { status: 400 });
    }
    // Save to library
    await supabase.from('sifted_articles').insert({
      user_id: profile.id,
      source_url: url,
      summary: siftData.summary,
      insight: siftData.insight,
      verdict: siftData.verdict,
      kept: true,
      reading_time: siftData.readingTime,
      thumbnail_url: siftData.thumbnailUrl,
      full_text: siftData.fullText,
    });
    return NextResponse.json({ status: 'sifted', result: siftData });
  }

  // Default: add to queue
  await supabase.from('queued_articles').insert({
    user_id: profile.id,
    url,
  });

  return NextResponse.json({ status: 'queued' });
}