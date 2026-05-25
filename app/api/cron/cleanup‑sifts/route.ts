import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Remove full_text from old discarded articles (keep the row, just drop the heavy column)
  const { error: updateError } = await supabaseAdmin
    .from('sifted_articles')
    .update({ full_text: null })
    .eq('kept', false)
    .lt('created_at', thirtyDaysAgo.toISOString())
    .not('full_text', 'is', null);

  if (updateError) {
    console.error('Cleanup update error:', updateError);
  }

  // 2. Delete fully stale rows if you want (optional – keep if you prefer)
  // Currently, we only clear full_text. If you ever want to delete the row entirely, use:
  // .delete() instead of .update()

  // 3. Clean up old cached sift results (optional – keep cache for popular URLs)
  const { error: cacheError } = await supabaseAdmin
    .from('sift_cache')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (cacheError) {
    console.error('Cache cleanup error:', cacheError);
  }

  return NextResponse.json({ success: true });
}