import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get('articleId');
  if (!articleId) return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('annotations')
    .select('id, selected_text, note, created_at')
    .eq('article_id', articleId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ annotations: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { articleId, selectedText, note } = await request.json();
  if (!articleId || !selectedText) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { error } = await supabase.from('annotations').insert({
    article_id: articleId,
    user_id: user.id,
    selected_text: selectedText,
    note: note || '',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { annotationId } = await request.json();
  if (!annotationId) return NextResponse.json({ error: 'Missing annotationId' }, { status: 400 });

  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('id', annotationId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}