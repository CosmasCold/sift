import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CopyRssButton from './CopyRssButton';
import ShareButton from './ShareButton';

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
        <h1 className="text-2xl font-bold text-white">Profile not found</h1>
        <Link href="/library" className="mt-4 inline-block text-accent underline">
          Go to Library
        </Link>
      </div>
    );
  }

  if (!profile.public_profile) {
    return (
      <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-2">@{profile.username}</h1>
        <div className="card">
          <p className="text-stone-300">This profile is private.</p>
          <Link href="/" className="inline-block mt-4 text-accent underline">
            Back to Sift
          </Link>
        </div>
      </main>
    );
  }

  const { data: allArticles } = await supabase
    .from('sifted_articles')
    .select('tags, created_at')
    .eq('user_id', profile.id)
    .eq('kept', true);

  const totalArticles = allArticles?.length || 0;
  const allTags = allArticles?.flatMap(a => a.tags || []) || [];
  const tagFreq: Record<string, number> = {};
  allTags.forEach(t => {
    tagFreq[t] = (tagFreq[t] || 0) + 1;
  });
  const uniqueTags = Object.keys(tagFreq).length;
  const dates = allArticles?.map(a => new Date(a.created_at)).filter(d => !isNaN(d.getTime())) || [];
  const streak = calculateStreak(dates);

  let query = supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at, tags, source_url')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (activeTag) query = query.contains('tags', [activeTag]);
  const { data: articles } = await query;

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'recently';
  const defaultCover = 'bg-gradient-to-r from-purple-800/50 via-purple-700/50 to-purple-600/50';

  return (
    <main className="flex-1 pb-16">
      {/* Cover section */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        {profile.cover_url ? (
          <Image src={profile.cover_url} alt="Cover" fill className="object-cover" unoptimized />
        ) : (
          <div className={`w-full h-full ${defaultCover}`} />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-4xl mx-auto bg-black/50 backdrop-blur-md rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-lg">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-stone-800 overflow-hidden shadow-lg">
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
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white">@{profile.username}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-stone-200">
                <span>📅 Reader since {joinDate}</span>
                {streak > 0 && <span>🔥 {streak} day streak</span>}
              </div>
            </div>
            <div className="md:ml-auto flex gap-2">
              <CopyRssButton username={username} />
              <ShareButton username={username} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-accent">{totalArticles}</div>
            <div className="text-xs text-stone-400">articles kept</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-accent">{uniqueTags}</div>
            <div className="text-xs text-stone-400">unique tags</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-accent">{streak}</div>
            <div className="text-xs text-stone-400">current streak</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-accent">∞</div>
            <div className="text-xs text-stone-400">curiosity</div>
          </div>
        </div>

        {/* Tag cloud */}
        {uniqueTags > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">📌 Tags I follow</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([tag, count]) => (
                  <Link
                    key={tag}
                    href={`/profile/${username}?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 rounded-full bg-stone-800 hover:bg-accent/20 transition-all text-stone-300 text-sm"
                    style={{ fontSize: `${Math.max(12, 12 + count * 1.5)}px` }}
                  >
                    #{tag} ({count})
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Active filter indicator */}
        {activeTag && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-stone-300">Filtering by tag:</span>
            <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-sm">#{activeTag}</span>
            <Link href={`/profile/${username}`} className="text-xs text-stone-400 underline">
              Clear
            </Link>
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📖 Reading list</span>
        </h2>

        {articles?.length ? (
          <div className="grid gap-5">
            {articles.map(article => (
              <div key={article.id} className="card transition-all">
                <a href={article.source_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                  <p className="text-stone-100 leading-relaxed">{article.summary}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs font-medium text-stone-400">{article.verdict}</span>
                    <span className="text-xs text-stone-500">·</span>
                    <span className="text-xs text-stone-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-stone-800 px-2 py-0.5 rounded-full text-stone-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-stone-400">
              {activeTag ? `No articles tagged with "${activeTag}".` : 'No public articles yet.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}