import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

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

  // Fetch articles
  const { data: articles, error: articlesError } = await supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(20);

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
        <button
          type="button"
          onClick={async () => {
            const feedUrl = `${window.location.origin}/profile/${username}/feed.xml`;
            await navigator.clipboard.writeText(feedUrl);
            alert('RSS feed URL copied to clipboard! You can paste it into any RSS reader (Feedly, Inoreader, etc.).');
          }}
          className="text-sm bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1 rounded-full transition-colors flex items-center gap-1"
          title="Copy RSS feed URL"
        >
          📡 Copy RSS Feed
        </button>
      </div>
      <p className="text-stone-500 mb-8">What they&apos;re reading and keeping.</p>
      {articles?.length ? (
        <div className="grid gap-4">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-2xl border p-5">
              <p className="text-stone-700">{article.summary}</p>
              <p className="text-xs text-stone-400 mt-2">
                {article.verdict} · {new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-stone-500">No public articles yet.</p>
      )}
    </main>
  );
}