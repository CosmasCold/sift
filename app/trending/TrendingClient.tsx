'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Users, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import Image from 'next/image';

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
      .then(data => {
        setArticles(data.articles || []);
      })
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
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
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
          className="space-y-4"
        >
          {articles.map((article, index) => (
            <motion.div
              key={article.source_url || index}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <GlassCard variant="interactive" className="p-5">
                <div className="flex gap-4">
                  {/* Rank badge */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400/10 flex items-center justify-center text-sm font-bold text-accent-400">
                    {index + 1}
                  </div>
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-800/50">
                    {article.thumbnail_url ? (
                      <Image
                        src={article.thumbnail_url}
                        alt=""
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-500">
                        <ImageOff className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-200 leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-surface-400">
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
                  {article.source_url && (
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start flex-shrink-0 text-accent-400 hover:underline text-sm flex items-center gap-1"
                    >
                      Read <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}