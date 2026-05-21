// app/api/feeds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET – list all feeds for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('sift_feeds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('GET /api/feeds error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feeds: data || [] });
  } catch (err) {
    console.error('GET /api/feeds crash:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// POST – add a new feed for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedUrl } = await request.json();
    if (!feedUrl || typeof feedUrl !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid feed URL' }, { status: 400 });
    }

    // Fetch feed title (optional, non‑blocking)
    let title = '';
    try {
      // Dynamic import to avoid server‑side module resolution issues
      const { default: Parser } = await import('rss-parser');
      const parser = new Parser();
      const feed = await parser.parseURL(feedUrl);
      title = feed.title || '';
    } catch (fetchErr) {
      console.log('Feed title fetch warning:', fetchErr);
      // Continue without title
    }

    const { data, error } = await supabase
      .from('sift_feeds')
      .insert({
        user_id: user.id,
        feed_url: feedUrl,
        title,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feed: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/feeds crash:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// DELETE – remove a feed by id
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing feed id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sift_feeds')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/feeds crash:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}