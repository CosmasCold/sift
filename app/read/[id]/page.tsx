import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, ExternalLink, ImageOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from('sifted_articles')
    .select('summary, full_text, verdict, source_url, thumbnail_url, reading_time, created_at')
    .eq('id', id)
    .single();

  if (error || !article || !article.full_text) {
    notFound();
  }

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      <GlassCard className="p-6 md:p-8">
        {/* Header with thumbnail and meta */}
        {article.thumbnail_url && (
          <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6 bg-surface-800/50">
            <Image
              src={article.thumbnail_url}
              alt="Article thumbnail"
              width={800}
              height={400}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
        )}

        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-700/50">
          <span
            className={`w-3 h-3 rounded-full ${
              article.verdict === 'Worth a full read'
                ? 'bg-verdict-green'
                : article.verdict === 'Skim this'
                ? 'bg-verdict-amber'
                : 'bg-verdict-grey'
            }`}
          />
          <span className="text-sm font-semibold text-surface-300">{article.verdict}</span>
          <div className="ml-auto flex items-center gap-3">
            {article.reading_time && (
              <span className="text-xs text-surface-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {article.reading_time} min read
              </span>
            )}
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-400 hover:underline flex items-center gap-1"
              >
                Original <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Full article text */}
        <article className="prose prose-invert max-w-none">
          {article.full_text.split('\n').map((paragraph, i) => (
            <p key={i} className="text-surface-200 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </article>
      </GlassCard>
    </main>
  );
}