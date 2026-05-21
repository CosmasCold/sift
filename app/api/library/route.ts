import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('sifted_articles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Library fetch error:', error);
      return NextResponse.json({ error: 'Failed to load library' }, { status: 500 });
    }

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('Library route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}