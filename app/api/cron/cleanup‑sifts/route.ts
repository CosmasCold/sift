import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error, count } = await supabase
      .from('sifted_articles')
      .delete({ count: 'exact' })
      .eq('kept', false)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Cleanup error:', error);
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }

    return NextResponse.json({ message: `Cleaned up ${count} old skipped articles.` });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}