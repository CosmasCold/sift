'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import Thumbnail from '@/components/Thumbnail';

interface TrendingArticle {
  source_url: string | null;
  summary: string;
  verdict: string;
  thumbnail_url: string | null;
  keeperCount: number;
  latestDate: string;
}

export default function TrendingClient() {
  const [articles, setArticles] = useState<TrendingArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => toast.error('Failed to load trending'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center pt-16">
        <div className="animate-spin w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-surface-50 flex items-center gap-2">
          <Flame className="w-6 h-6 text-accent-400" />
          Trending
        </h1>
        <p className="text-surface-400 mt-2">
          Articles being kept by the Sift community right now.
        </p>
      </div>

      {articles.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Users className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-300 text-lg font-medium mb-1">
            Nothing trending yet.
          </p>
          <p className="text-surface-400 text-sm">
            When public readers start keeping articles, they&apos;ll appear here.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        >
          {articles.map((article, index) => (
            <motion.div
              key={article.source_url || index}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
              className="hover:-translate-y-0.5 transition-transform"
            >
              <GlassCard variant="interactive" className="p-5 h-full flex flex-col">
                <div className="flex items-start gap-4 flex-1">
                  {/* Rank badge */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400/10 flex items-center justify-center text-sm font-bold text-accent-400">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 leading-relaxed line-clamp-4 mb-3">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {article.keeperCount} {article.keeperCount === 1 ? 'keeper' : 'keepers'}
                      </span>
                      <span>·</span>
                      <span>{article.verdict}</span>
                      <span>·</span>
                      <span>{new Date(article.latestDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Thumbnail – larger, below text */}
                <div className="mt-4">
                  <Thumbnail
                    src={article.thumbnail_url}
                    size={160}
                    className="rounded-xl w-full h-32"
                  />
                </div>

                {article.source_url && (
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 self-end inline-flex items-center gap-1 text-accent-400 hover:underline text-sm"
                  >
                    Read <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}