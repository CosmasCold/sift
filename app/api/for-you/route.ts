import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RecommendedArticle {
  id: string;
  summary: string;
  verdict: string;
  created_at: string;
  source_url: string | null;
  thumbnail_url: string | null;
  user_id: string;
  user_profiles: { username: string; avatar_url: string | null } | null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get IDs of articles the user already has in their library
  const { data: existingArticles } = await supabase
    .from('sifted_articles')
    .select('source_url')
    .eq('user_id', user.id);

  const existingUrls = new Set((existingArticles || []).map(a => a.source_url).filter(Boolean));

  // Get user's top tags (from kept articles)
  const { data: userTags } = await supabase
    .from('sifted_articles')
    .select('tags')
    .eq('user_id', user.id)
    .eq('kept', true);

  const tagCounts: Record<string, number> = {};
  (userTags || []).forEach(a => (a.tags || []).forEach((t: string) => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  }));
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  // Get IDs of feeds the user follows
  const { data: userFeeds } = await supabase
    .from('sift_feeds')
    .select('id')
    .eq('user_id', user.id);
  const feedIds = (userFeeds || []).map(f => f.id);

  // Get public user IDs
  const { data: publicUsers } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('public_profile', true);
  const publicUserIds = (publicUsers || []).map(u => u.id);

  const recommendations: RecommendedArticle[] = [];

  // 1. Feed-based recommendations
  if (feedIds.length > 0 && publicUserIds.length > 0) {
    const { data: feedArticles } = await supabase
      .from('sifted_articles')
      .select('id, summary, verdict, created_at, source_url, thumbnail_url, user_id, user_profiles!user_id(username, avatar_url)')
      .in('feed', feedIds)
      .eq('kept', true)
      .neq('user_id', user.id)
      .in('user_id', publicUserIds)
      .order('created_at', { ascending: false })
      .limit(15);

    if (feedArticles) {
      const filtered = (feedArticles as unknown as RecommendedArticle[]).filter(a => !existingUrls.has(a.source_url));
      recommendations.push(...filtered);
    }
  }

  // 2. Tag-based trending
  if (topTags.length > 0 && publicUserIds.length > 0) {
    const { data: tagArticles } = await supabase
      .from('sifted_articles')
      .select('id, summary, verdict, created_at, source_url, thumbnail_url, user_id, user_profiles!user_id(username, avatar_url), tags')
      .in('user_id', publicUserIds)
      .eq('kept', true)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tagArticles) {
      const matched = (tagArticles as unknown as (RecommendedArticle & { tags: string[] })[]).filter(a =>
        (a.tags || []).some((t: string) => topTags.includes(t)) &&
        !existingUrls.has(a.source_url)
      );
      recommendations.push(...matched);
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = recommendations.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort by recency
  unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ articles: unique.slice(0, 20) });
}