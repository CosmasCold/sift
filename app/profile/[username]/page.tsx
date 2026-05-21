import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Article {
  id: string;
  summary: string;
  verdict: string;
  created_at: string;
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, username, public_profile, is_pro')
    .eq('username', params.username)
    .single();

  if (!profile || !profile.public_profile) return notFound();

  // Pro gate: if not pro, show upgrade message instead of articles
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

  // Pro user – show their kept articles (include 'id' in select)
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
          {articles.map((article: Article) => (
            <div key={article.id} className="bg-white rounded-2xl border p-5">
              <p className="text-stone-700">{article.summary}</p>
              <p className="text-xs text-stone-400 mt-2">{article.verdict} · {new Date(article.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-stone-500">No public articles yet.</p>
      )}
    </main>
  );
}