import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // 1. Get IDs of users with public profiles
  const { data: publicUsers, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('public_profile', true);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!publicUsers || publicUsers.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  const publicUserIds = publicUsers.map(u => u.id);

  // 2. Fetch kept articles from those users, including thumbnail_url
  const { data: articles, error: articlesError } = await supabase
    .from('sifted_articles')
    .select('source_url, summary, verdict, thumbnail_url, user_id, created_at')
    .in('user_id', publicUserIds)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(200);

  if (articlesError) {
    return NextResponse.json({ error: articlesError.message }, { status: 500 });
  }

  // 3. Aggregate: group by source_url (or by summary if no URL)
  const trendingMap = new Map<string, {
    source_url: string | null;
    summary: string;
    verdict: string;
    thumbnail_url: string | null;
    keepers: Set<string>;
    latestDate: string;
  }>();

  (articles || []).forEach(article => {
    const key = article.source_url || article.summary;
    const existing = trendingMap.get(key);
    if (existing) {
      existing.keepers.add(article.user_id);
      if (article.created_at > existing.latestDate) {
        existing.latestDate = article.created_at;
      }
      // keep first thumbnail_url found
      if (!existing.thumbnail_url && article.thumbnail_url) {
        existing.thumbnail_url = article.thumbnail_url;
      }
    } else {
      trendingMap.set(key, {
        source_url: article.source_url,
        summary: article.summary,
        verdict: article.verdict,
        thumbnail_url: article.thumbnail_url,
        keepers: new Set([article.user_id]),
        latestDate: article.created_at,
      });
    }
  });

  const trending = Array.from(trendingMap.values())
    .map(item => ({
      source_url: item.source_url,
      summary: item.summary,
      verdict: item.verdict,
      thumbnail_url: item.thumbnail_url,
      keeperCount: item.keepers.size,
      latestDate: item.latestDate,
    }))
    .sort((a, b) => b.keeperCount - a.keeperCount || new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
    .slice(0, 20);

  return NextResponse.json({ articles: trending });
}