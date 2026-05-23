'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';

interface FeedArticle {
  id: string;
  summary: string;
  verdict: string;
  created_at: string;
  source_url: string | null;
  user_id: string;
  user_profiles: { username: string; avatar_url: string | null } | null;
}

export default function FollowingPage() {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/following-feed')
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => toast.error('Failed to load'))
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
      <h1 className="text-3xl font-semibold text-surface-50 mb-2 flex items-center gap-2">
        <Users className="w-6 h-6 text-accent-400" />
        Following
      </h1>
      <p className="text-surface-400 mb-8">
        Recent articles kept by people you follow.
      </p>

      {articles.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Users className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-300 text-lg font-medium mb-1">
            Your feed is empty
          </p>
          <p className="text-surface-400 text-sm mb-4">
            Follow other readers to see what they&apos;re keeping.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-400/10 text-accent-400 rounded-xl text-sm font-medium hover:bg-accent-400/20 transition"
          >
            Explore profiles
          </Link>
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
          {articles.map(article => (
            <motion.div
              key={article.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <GlassCard variant="interactive" className="p-5">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-surface-400">
                      <span>{article.verdict}</span>
                      <span>·</span>
                      <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      {article.user_profiles?.username && (
                        <>
                          <span>·</span>
                          <Link
                            href={`/profile/${article.user_profiles.username}`}
                            className="text-accent-400 hover:underline"
                          >
                            @{article.user_profiles.username}
                          </Link>
                        </>
                      )}
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