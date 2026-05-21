import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CopyRssButton from './CopyRssButton';

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { username } = await params;
  const { tag: activeTag } = await searchParams;

  if (!username || username === '') {
    redirect('/library');
  }

  const supabase = await createClient();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, username, public_profile, is_pro, created_at')
    .eq('username', username)
    .maybeSingle();

  if (profileError) {
    console.error('Profile error:', profileError);
    return (
      <div className="pt-16 text-center text-red-600">
        Error loading profile: {profileError.message}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-16 text-center">
        <h1 className="text-2xl font-bold text-stone-800">Profile not found</h1>
        <p className="text-stone-500 mt-2">
          No user with username &quot;{username}&quot; exists.
        </p>
        <Link href="/library" className="inline-block mt-4 text-accent underline">
          Go to Library
        </Link>
      </div>
    );
  }

  if (!profile.public_profile) {
    return (
      <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">@{profile.username}</h1>
        <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-card mt-6">
          <p className="text-stone-600">This profile is private.</p>
          <Link href="/" className="inline-block mt-4 text-accent underline">
            Back to Sift
          </Link>
        </div>
      </main>
    );
  }

  // Build query for articles (always kept)
  let query = supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at, tags')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // Apply tag filter if provided
  if (activeTag && activeTag.trim() !== '') {
    query = query.contains('tags', [activeTag.trim()]);
  }

  const { data: articles, error: articlesError } = await query;

  if (articlesError) {
    console.error('Articles error:', articlesError);
    return (
      <div className="pt-16 text-center text-red-600">
        Error loading articles: {articlesError.message}
      </div>
    );
  }

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'recently';

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-3xl font-serif font-bold text-stone-800">@{profile.username}</h1>
        <span className="inline-block bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">
          Reader since {joinDate}
        </span>
        <CopyRssButton username={username} />
      </div>

      {/* Tag filter indicator and clear link */}
      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-stone-600">Filtering by tag:</span>
          <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-sm flex items-center gap-1">
            #{activeTag}
          </span>
          <Link
            href={`/profile/${username}`}
            className="text-xs text-stone-400 hover:text-stone-600 underline"
          >
            Clear filter
          </Link>
        </div>
      )}

      <p className="text-stone-500 mb-8">What they&apos;re reading and keeping.</p>

      {articles?.length ? (
        <div className="grid gap-4">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-2xl border p-5">
              <p className="text-stone-700">{article.summary}</p>
              <p className="text-xs text-stone-400 mt-2">
                {article.verdict} · {new Date(article.created_at).toLocaleDateString()}
              </p>
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {article.tags.map((tag: string) => (
                    <a
                      key={tag}
                      href={`/profile/${username}?tag=${encodeURIComponent(tag)}`}
                      className="text-xs bg-stone-100 hover:bg-accent/20 px-2 py-0.5 rounded-full text-stone-600 transition-colors"
                    >
                      {tag}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-stone-500">
          {activeTag ? `No articles tagged with "${activeTag}".` : 'No public articles yet.'}
        </p>
      )}
    </main>
  );
}