'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import AuthGuard from '@/components/AuthGuard';
import UserAvatar from '@/components/UserAvatar';
import ReportButton from '@/components/ReportButton';

interface RecommendedArticle {
  id: string;
  summary: string;
  verdict: string;
  created_at: string;
  source_url: string | null;
  thumbnail_url: string | null;
  user_id: string;
  user_profiles: { username: string; avatar_url: string | null };
}

function ForYouInner() {
  const [articles, setArticles] = useState<RecommendedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/for-you')
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => toast.error('Failed to load recommendations'))
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
          <Sparkles className="w-6 h-6 text-accent-400" />
          For You
        </h1>
        <p className="text-surface-400 mt-2">
          Personalised picks based on your feeds and interests.
        </p>
      </div>

      {articles.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Sparkles className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-300 text-lg font-medium mb-1">
            No recommendations yet.
          </p>
          <p className="text-surface-400 text-sm mb-4">
            Follow some feeds, keep a few articles, and we&apos;ll find more for you.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-400/10 text-accent-400 rounded-xl text-sm font-medium hover:bg-accent-400/20 transition"
          >
            Discover feeds
          </Link>
        </GlassCard>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
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
                  {/* Thumbnail */}
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
                            className="flex items-center gap-1 text-accent-400 hover:underline"
                          >
                            <UserAvatar
                              username={article.user_profiles.username}
                              avatarKey={article.user_profiles.avatar_url}
                              size={16}
                            />
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
                  <ReportButton contentType="article" contentId={article.id} className="self-start" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}

export default function ForYouPage() {
  return (
    <AuthGuard>
      <ForYouInner />
    </AuthGuard>
  );
}