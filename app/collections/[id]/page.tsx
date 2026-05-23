'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { GlassCard } from '@/components/ui/GlassCard';
import toast from 'react-hot-toast';

interface Article {
  id: string;
  summary: string;
  verdict: string;
  source_url: string | null;
  thumbnail_url: string | null;
}

interface Collection {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  created_at: string;
  curator: string;
}

export default function CollectionPage() {
  const params = useParams();
  const id = params.id as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections?id=${id}`)
      .then(r => r.json())
      .then(data => {
        setCollection(data.collection);
        setArticles(data.articles || []);
      })
      .catch(() => toast.error('Failed to load collection'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center pt-16">
        <div className="animate-spin w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="pt-16 text-center">
        <h1 className="text-2xl font-semibold text-surface-50">Collection not found</h1>
        <Link href="/collections" className="mt-4 inline-block text-accent-400 underline">
          Browse collections
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <Link href="/collections" className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All collections
      </Link>

      <GlassCard className="p-6 mb-8">
        <h1 className="text-2xl font-semibold text-surface-50 mb-2">{collection.title}</h1>
        {collection.description && (
          <p className="text-surface-400 text-sm mb-2">{collection.description}</p>
        )}
        <p className="text-xs text-surface-500 flex items-center gap-1">
          <User className="w-3 h-3" />
          Curated by @{collection.curator}
        </p>
      </GlassCard>

      {articles.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-surface-400">No articles in this collection yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {articles.map(article => (
            <GlassCard key={article.id} variant="interactive" className="p-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-surface-700/50">
                  {article.thumbnail_url ? (
                    <Image
                      src={article.thumbnail_url}
                      alt=""
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-400 text-xs">
                      📄
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-surface-400">{article.verdict}</span>
                    {article.source_url && (
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-400 hover:underline text-xs flex items-center gap-1"
                      >
                        Read <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </main>
  );
}