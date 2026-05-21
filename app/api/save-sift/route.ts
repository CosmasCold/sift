import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, sourceUrl, summary, insight, verdict } = await request.json();
    if (!summary || !verdict) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Automatically discard skipped articles
    const kept = verdict !== 'You can skip this';

    const { error } = await supabase.from('sifted_articles').insert({
  user_id: user.id,
  source_url: sourceUrl || null,
  summary,
  insight: insight || '',
  verdict,
  kept,
});

    if (error) {
      console.error('Save sift error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save sift route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}