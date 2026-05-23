import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CopyRssButton from './CopyRssButton';
import ShareButton from './ShareButton';
import FollowButton from '@/components/FollowButton';
import ProfileTabs from '@/components/ProfileTabs';
import UserAvatar from '@/components/UserAvatar';

const COVERS: Record<string, string> = {
  'lavender-charcoal':
    'bg-gradient-to-r from-accent-800/40 via-accent-700/30 to-accent-600/20',
  'charcoal-lavender':
    'bg-gradient-to-r from-surface-800 via-surface-700 to-accent-800/40',
  'sage-charcoal':
    'bg-gradient-to-r from-emerald-800/30 via-surface-800 to-surface-700',
  'rose-gold':
    'bg-gradient-to-r from-rose-800/30 via-amber-700/20 to-surface-800',
  'sky-charcoal':
    'bg-gradient-to-r from-sky-800/30 via-surface-800 to-accent-800/40',
  midnight:
    'bg-gradient-to-r from-surface-950 via-surface-900 to-surface-800',
};

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

  // Fetch articles with thumbnail
  const { data: allArticles } = await supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at, tags, source_url, thumbnail_url, reading_time')
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

  // Currently sifting (queue)
  const { data: queueItem } = await supabase
    .from('queued_articles')
    .select('url')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  // Reading stats: articles per month for last 6 months
  const stats: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    stats.push({ month: monthKey, count: 0 });
  }
  allArticles?.forEach(article => {
    const d = new Date(article.created_at);
    if (isNaN(d.getTime())) return;
    const articleMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const stat = stats.find(s => {
      const [m, y] = s.month.split(' ');
      const statMonth = new Date(parseInt(y), new Date(`${m} 1, 2000`).getMonth(), 1);
      return statMonth.getTime() === articleMonth.getTime();
    });
    if (stat) stat.count++;
  });

  // Follower / following counts and lists
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  // Followers list (who follows this profile)
  const { data: followersRaw } = await supabase
    .from('follows')
    .select('follower_id, user_profiles!follower_id(username, avatar_url)')
    .eq('following_id', profile.id)
    .limit(10);

  // Following list (who this profile follows)
  const { data: followingRaw } = await supabase
    .from('follows')
    .select('following_id, user_profiles!following_id(username, avatar_url)')
    .eq('follower_id', profile.id)
    .limit(10);

  // Map to clean, type-safe arrays
  type RawFollow = {
    follower_id?: string;
    following_id?: string;
    user_profiles: { username: string; avatar_url: string | null };
  };

  const followers = ((followersRaw || []) as unknown as RawFollow[]).map((f) => ({
    follower_id: f.follower_id!,
    username: f.user_profiles.username,
    avatar_url: f.user_profiles.avatar_url,
  }));

  const following = ((followingRaw || []) as unknown as RawFollow[]).map((f) => ({
    following_id: f.following_id!,
    username: f.user_profiles.username,
    avatar_url: f.user_profiles.avatar_url,
  }));

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'recently';

  const coverClass = COVERS[profile.cover_url || 'charcoal-lavender'] || COVERS['charcoal-lavender'];

  return (
    <main className="flex-1 pb-16">
      
            {/* Cover section */}
      <div className="relative w-full">
        <div className="h-48 md:h-64 w-full overflow-hidden">
          <div className={`w-full h-full ${coverClass}`} />
          <div className="absolute inset-0 bg-surface-950/20" />
        </div>

        {/* Profile card – overlaps the cover, always fully visible */}
        <div className="max-w-4xl mx-auto px-4 -mt-20 md:-mt-24 relative z-10">
          <div className="bg-surface-800 rounded-2xl border border-surface-700/50 p-4 shadow-card flex flex-col md:flex-row items-center gap-4">
            <UserAvatar
              username={profile.username}
              avatarKey={profile.avatar_url}
              size={96}
            />
            <div className="text-center md:text-left flex-1 min-w-0">
              <h1 className="text-3xl font-semibold text-surface-50 leading-tight truncate">
                @{profile.username}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-1 text-sm text-surface-300">
                <span>📅 Reader since {joinDate}</span>
                {streak > 0 && <span>🔥 {streak} day streak</span>}
                {queueItem && (
                  <span className="flex items-center gap-1 text-accent-400">
                    <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                    Currently sifting
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
        stats={stats}
        queueItem={queueItem}
        allArticles={allArticles || []}
        followers={followers}
        following={following}
      />
    </main>
  );
}