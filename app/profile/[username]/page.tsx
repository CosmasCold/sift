// app/profile/[username]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, username')
    .eq('username', params.username)
    .eq('public_profile', true)
    .single();

  if (!profile) return notFound();

  const { data: articles } = await supabase
    .from('sifted_articles')
    .select('id, summary, verdict, created_at')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <Link
        href="/"
        className="text-sm text-stone-500 hover:text-stone-700 mb-4 inline-block"
      >
        ← Sift
      </Link>
      <h1 className="text-3xl font-serif font-bold text-stone-800 mb-1">
        @{profile.username}
      </h1>
      <p className="text-stone-500 mb-8">What they&apos;re reading and keeping.</p>

      {articles && articles.length > 0 ? (
        <div className="grid gap-4">
          {articles.map((article: { id: string; summary: string; verdict: string; created_at: string }) => (
            <div
              key={article.id}
              className="bg-white/90 rounded-2xl border border-stone-200/80 p-5 shadow-sm"
            >
              <p className="text-sm text-stone-700 leading-relaxed">
                {article.summary}
              </p>
              <p className="text-xs text-stone-400 mt-2">
                {article.verdict} · {new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-stone-500">
          Nothing here yet.
        </div>
      )}
    </main>
  );
}