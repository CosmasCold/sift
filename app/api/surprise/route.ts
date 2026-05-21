// app/api/surprise/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('sifted_articles')
    .select('*')
    .eq('user_id', user.id)
    .eq('kept', true)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No kept articles' }, { status: 404 });
  }

  const random = data[Math.floor(Math.random() * data.length)];
  return NextResponse.json({ article: random });
}