import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId, tags } = await request.json();
    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sifted_articles')
      .update({ tags: tags || [] })
      .eq('id', articleId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Update tags error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update tags route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}