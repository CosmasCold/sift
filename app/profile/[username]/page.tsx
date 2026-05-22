import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CopyRssButton from './CopyRssButton';
import ShareButton from './ShareButton';
import FollowButton from '@/components/FollowButton';
import ProfileTabs from '@/components/ProfileTabs';

function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const unique = [...new Set(dates.map(d => d.toDateString()))];
  unique.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 1;
  const today = new Date().toDateString();
  if (unique[0] !== today) return 0;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { username } = await params;
  const { tag: activeTag } = await searchParams;
  if (!username) redirect('/library');

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, username, public_profile, created_at, avatar_url, cover_url')
    .eq('username', username)
    .maybeSingle();

  if (error || !profile) {
    return (
      <div className="pt-16 text-center">
        <h1 className="text-2xl font-semibold text-surface-50">Profile not found</h1>
        <Link href="/library" className="mt-4 inline-block text-accent-400 underline">
          Go to Library
        </Link>
      </div>
    );
  }

  if (!profile.public_profile) {
    return (
      <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-semibold text-surface-50 mb-2">@{profile.username}</h1>
        <div className="bg-surface-800 rounded-2xl border border-surface-700/50 p-6">
          <p className="text-surface-400">This profile is private.</p>
          <Link href="/" className="inline-block mt-4 text-accent-400 underline">
            Back to Sift
          </Link>
        </div>
      </main>
    );
  }

  // Fetch articles and tag data
  const { data: allArticles } = await supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at, tags, source_url')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(100);

  const totalArticles = allArticles?.length || 0;
  const allTags = allArticles?.flatMap(a => a.tags || []) || [];
  const tagFreq: Record<string, number> = {};
  allTags.forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; });
  const uniqueTags = Object.keys(tagFreq).length;
  const dates = allArticles?.map(a => new Date(a.created_at)).filter(d => !isNaN(d.getTime())) || [];
  const streak = calculateStreak(dates);

  // Follower / following counts
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'recently';
  const defaultCover = 'bg-gradient-to-r from-accent-800/40 via-accent-700/30 to-accent-600/20';

  return (
    <main className="flex-1 pb-16">
      {/* Cover section */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        {profile.cover_url ? (
          <Image src={profile.cover_url} alt="Cover" fill className="object-cover" unoptimized />
        ) : (
          <div className={`w-full h-full ${defaultCover}`} />
        )}
        <div className="absolute inset-0 bg-surface-950/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-4xl mx-auto bg-surface-800 rounded-2xl border border-surface-700/50 p-4 flex flex-col md:flex-row items-center gap-4 shadow-card">
            <div className="w-24 h-24 rounded-full border-4 border-surface-700 bg-surface-800 overflow-hidden shadow-lg">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={96}
                  height={96}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-surface-50">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-semibold text-surface-50">@{profile.username}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-surface-300">
                <span>📅 Reader since {joinDate}</span>
                {streak > 0 && <span>🔥 {streak} day streak</span>}
              </div>
            </div>
            <div className="md:ml-auto flex gap-2">
              <FollowButton followingId={profile.id} />
              <CopyRssButton username={username} />
              <ShareButton username={username} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <ProfileTabs
        username={username}
        articles={allArticles || []}
        tagFreq={tagFreq}
        totalArticles={totalArticles}
        uniqueTags={uniqueTags}
        streak={streak}
        joinDate={joinDate}
        followingCount={followingCount || 0}
        followerCount={followerCount || 0}
        activeTag={activeTag}
      />
    </main>
  );
}