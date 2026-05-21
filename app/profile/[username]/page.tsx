import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CopyRssButton from './CopyRssButton';

// Helper to calculate reading streak (consecutive days with kept articles)
function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const uniqueDates = [...new Set(dates.map(d => d.toDateString()))];
  uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 1;
  const today = new Date().toDateString();
  if (uniqueDates[0] !== today) return 0;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i-1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) streak++;
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

  if (!username || username === '') redirect('/library');

  const supabase = await createClient();

  // Fetch profile with cover_url
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, username, public_profile, is_pro, created_at, avatar_url, cover_url')
    .eq('username', username)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <div className="pt-16 text-center">
        <h1 className="text-2xl font-bold text-stone-800">Profile not found</h1>
        <Link href="/library" className="inline-block mt-4 text-accent underline">Go to Library</Link>
      </div>
    );
  }

  if (!profile.public_profile) {
    return (
      <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">@{profile.username}</h1>
        <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-card mt-6">
          <p className="text-stone-600">This profile is private.</p>
          <Link href="/" className="inline-block mt-4 text-accent underline">Back to Sift</Link>
        </div>
      </main>
    );
  }

  // Fetch all kept articles (for stats and tag cloud)
  const { data: allArticles } = await supabase
    .from('sifted_articles')
    .select('tags, created_at')
    .eq('user_id', profile.id)
    .eq('kept', true);

  // Compute stats
  const totalArticles = allArticles?.length || 0;
  const allTags = allArticles?.flatMap(a => a.tags || []) || [];
  const tagFrequency: Record<string, number> = {};
  allTags.forEach(tag => { tagFrequency[tag] = (tagFrequency[tag] || 0) + 1; });
  const uniqueTags = Object.keys(tagFrequency).length;
  const dates = allArticles?.map(a => new Date(a.created_at)).filter(d => !isNaN(d.getTime())) || [];
  const streak = calculateStreak(dates);

  // Fetch paginated articles for display (with source_url and tags)
  let query = supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at, tags, source_url')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (activeTag && activeTag.trim() !== '') {
    query = query.contains('tags', [activeTag.trim()]);
  }

  const { data: articles } = await query;

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'recently';

  
  

  return (
    <main className="flex-1 pb-16">
      {/* Cover Section */}
      <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-purple-700 via-accent to-pink-600">
        {profile.cover_url && (
          <Image src={profile.cover_url} alt="Cover" fill className="object-cover" unoptimized />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.username} width={96} height={96} className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-accent/20 flex items-center justify-center text-4xl">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">@{profile.username}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm opacity-90">
                <span>📅 Reader since {joinDate}</span>
                {streak > 0 && <span>🔥 {streak} day streak</span>}
              </div>
            </div>
            <div className="md:ml-auto flex gap-2">
              <CopyRssButton username={username} />
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-full px-3 py-1 text-sm transition"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <div className="text-2xl font-bold text-accent">{totalArticles}</div>
            <div className="text-xs text-stone-500">articles kept</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <div className="text-2xl font-bold text-accent">{uniqueTags}</div>
            <div className="text-xs text-stone-500">unique tags</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <div className="text-2xl font-bold text-accent">{streak}</div>
            <div className="text-xs text-stone-500">current streak</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
            <div className="text-2xl font-bold text-accent">∞</div>
            <div className="text-xs text-stone-500">curiosity</div>
          </div>
        </div>

        {/* Tag Cloud (if any tags) */}
        {uniqueTags > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 mb-3">📌 Tags I follow</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([tag, count]: [string, number]) => (
                  <Link
                    key={tag}
                    href={`/profile/${username}?tag=${encodeURIComponent(tag)}`}
                    className={`inline-block px-3 py-1 rounded-full bg-stone-100 hover:bg-accent/20 transition-all hover:scale-105 text-stone-700 text-sm`}
                    style={{ fontSize: `${Math.max(12, 12 + count * 1.5)}px` }}
                  >
                    #{tag} ({count})
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Active tag filter indicator */}
        {activeTag && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-stone-600">Filtering by tag:</span>
            <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-sm">#{activeTag}</span>
            <Link href={`/profile/${username}`} className="text-xs text-stone-400 underline">Clear</Link>
          </div>
        )}

        <h2 className="text-xl font-serif font-bold text-stone-800 mb-4">📖 Reading list</h2>

        {articles?.length ? (
          <div className="grid gap-5">
            {articles.map((article) => (
              <div
                key={article.id}
                className="group bg-white rounded-2xl border border-stone-200 hover:border-accent/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {article.source_url ? (
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="block p-5">
                    <p className="text-stone-800 leading-relaxed group-hover:text-accent-dark transition-colors">
                      {article.summary}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-xs font-medium text-stone-400">{article.verdict}</span>
                      <span className="text-xs text-stone-300">·</span>
                      <span className="text-xs text-stone-400">{new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ) : (
                  <div className="p-5">
                    <p className="text-stone-800 leading-relaxed">{article.summary}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-xs font-medium text-stone-400">{article.verdict}</span>
                      <span className="text-xs text-stone-300">·</span>
                      <span className="text-xs text-stone-400">{new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.map((tag: string) => (
                          <span key={tag} className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/50 rounded-2xl border border-stone-200">
            <p className="text-stone-500">
              {activeTag ? `No articles tagged with "${activeTag}".` : 'No public articles yet.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}