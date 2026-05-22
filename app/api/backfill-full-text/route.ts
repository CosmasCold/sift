import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get articles without full_text, that have a source_url
  const { data: articles, error } = await supabase
    .from('sifted_articles')
    .select('id, source_url')
    .eq('user_id', user.id)
    .is('full_text', null)
    .not('source_url', 'is', null)
    .limit(50); // do 50 at a time to avoid timeouts

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: 'No articles to backfill.' });
  }

  let updated = 0;
  for (const article of articles) {
    try {
      const res = await fetch(article.source_url!, {
        headers: { 'User-Agent': 'Mozilla/5.0 SiftBot/1.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      $('script, style, nav, footer, header, aside, .sidebar, .comments, noscript').remove();

      let text = $('article, [role="main"], main, .post-content, .article-body, .entry-content').text();
      if (!text) text = $('body').text();
      text = text.replace(/\s+/g, ' ').trim().substring(0, 4000);

      if (text.length >= 100) {
        await supabase
          .from('sifted_articles')
          .update({ full_text: text })
          .eq('id', article.id)
          .eq('user_id', user.id);
        updated++;
      }
    } catch (err) {
      console.error(`Backfill failed for ${article.source_url}`, err);
    }
  }

  return NextResponse.json({
    message: `Backfill complete. Updated ${updated} articles.`,
  });
}