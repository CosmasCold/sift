import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const time = request.nextUrl.searchParams.get('time') || undefined; // optional minutes
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = supabase
    .from('sifted_articles')
    .select('id, summary, verdict, source_url, thumbnail_url, reading_time, tags')
    .eq('user_id', user.id)
    .eq('kept', true)
    .order('created_at', { ascending: false }) // prefer recent
    .order('verdict', { ascending: true }); // order: Skim this, Worth a full read, You can skip this? Actually verdict order doesn't matter, we want Worth a full read first, then Skim this, then skip. Since the default ordering is alphabetical, we can handle it in JS.

  // If a time filter is provided, only suggest articles within that reading time
  if (time && !isNaN(Number(time))) {
    const maxMinutes = Number(time);
    // reading_time could be null; treat null as unknown, exclude if we can't determine
    query = query.not('reading_time', 'is', null).lte('reading_time', maxMinutes);
  }

  const { data: articles, error } = await query.limit(10); // get a small pool to rank

  if (error || !articles || articles.length === 0) {
    return NextResponse.json({ article: null });
  }

  // Rank: "Worth a full read" first, then "Skim this", then others
  const verdictRank: Record<string, number> = {
    'Worth a full read': 0,
    'Skim this': 1,
    'You can skip this': 2,
  };

  articles.sort((a, b) => {
    const rankA = verdictRank[a.verdict] ?? 3;
    const rankB = verdictRank[b.verdict] ?? 3;
    return rankA - rankB;
  });

  // Pick the top one (could also add a random shuffle within same verdict for variety)
  const suggestion = articles[0];

  return NextResponse.json({ article: suggestion });
}