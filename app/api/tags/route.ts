import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET all tags for current user with counts
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('sifted_articles')
    .select('tags')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tagCounts: Record<string, number> = {};
  (data || []).forEach(row => {
    (row.tags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ tags });
}

// PUT – Rename a tag (oldName -> newName)
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { oldName, newName } = await request.json();
  if (!oldName || !newName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Fetch all articles with old tag and update each
  const { data: articles, error: fetchErr } = await supabase
    .from('sifted_articles')
    .select('id, tags')
    .eq('user_id', user.id)
    .contains('tags', [oldName]);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const updates = (articles || []).map(article => {
    const newTags = (article.tags || []).map((t: string) => (t === oldName ? newName : t));
    return supabase
      .from('sifted_articles')
      .update({ tags: newTags })
      .eq('id', article.id)
      .eq('user_id', user.id);
  });

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}

// POST – Merge two tags (source -> target)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { source, target } = await request.json();
  if (!source || !target) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (source === target) return NextResponse.json({ error: 'Tags are the same' }, { status: 400 });

  // Find articles with source tag
  const { data: articles, error: fetchErr } = await supabase
    .from('sifted_articles')
    .select('id, tags')
    .eq('user_id', user.id)
    .contains('tags', [source]);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const updates = (articles || []).map(article => {
    const newTags = (article.tags || [])
      .map((t: string) => (t === source ? target : t))
      .filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i); // unique
    return supabase
      .from('sifted_articles')
      .update({ tags: newTags })
      .eq('id', article.id)
      .eq('user_id', user.id);
  });

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}

// DELETE – Remove a tag from all articles
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tag } = await request.json();
  if (!tag) return NextResponse.json({ error: 'Missing tag' }, { status: 400 });

  const { data: articles, error: fetchErr } = await supabase
    .from('sifted_articles')
    .select('id, tags')
    .eq('user_id', user.id)
    .contains('tags', [tag]);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const updates = (articles || []).map(article => {
    const newTags = (article.tags || []).filter((t: string) => t !== tag);
    return supabase
      .from('sifted_articles')
      .update({ tags: newTags })
      .eq('id', article.id)
      .eq('user_id', user.id);
  });

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}