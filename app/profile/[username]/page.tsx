import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // If no username, redirect to library
  if (!username || username === '') {
    redirect('/library');
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, username, public_profile, is_pro')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Profile query error:', error);
    return <div className="pt-16 text-center text-red-500">Database error: {error.message}</div>;
  }

  if (!profile) {
    return (
      <div className="pt-16 text-center">
        <h1 className="text-2xl font-bold text-stone-800">Profile not found</h1>
        <p className="text-stone-500 mt-2">No user with username &quot;{username}&quot; exists.</p>
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

  // Pro gate (comment out for testing)
  if (!profile.is_pro) {
    return (
      <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">@{profile.username}</h1>
        <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-card mt-6">
          <p className="text-stone-600">This profile is only visible to Pro users.</p>
          <Link href="/pricing" className="inline-block mt-4 bg-accent text-white px-6 py-2 rounded-xl">
            Upgrade to Pro
          </Link>
        </div>
      </main>
    );
  }

  const { data: articles } = await supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-stone-800 mb-1">@{profile.username}</h1>
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