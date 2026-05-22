'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Clock, BarChart3 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface TagFrequency {
  [tag: string]: number;
}

interface Article {
  id: string;
  summary: string;
  verdict: string;
  created_at: string;
  tags: string[];
  source_url: string | null;
  thumbnail_url: string | null;
  reading_time: number | null;
}

interface ProfileTabsProps {
  username: string;
  articles: Article[];
  tagFreq: TagFrequency;
  totalArticles: number;
  uniqueTags: number;
  streak: number;
  joinDate: string;
  followingCount: number;
  followerCount: number;
  activeTag?: string;
  stats: { month: string; count: number }[];
  queueItem: { url: string } | null;
  allArticles: Article[];
  followers: { follower_id: string; username: string; avatar_url: string | null }[];
  following: { following_id: string; username: string; avatar_url: string | null }[];
}

const tabs = [
  { key: 'reading', label: 'Reading List' },
  { key: 'tags', label: 'Tags' },
  { key: 'network', label: 'Network' },
  { key: 'stats', label: 'Stats' },
];

export default function ProfileTabs({
  username,
  articles,
  tagFreq,
  totalArticles,
  uniqueTags,
  streak,
  joinDate,
  followingCount,
  followerCount,
  activeTag,
  stats,
  queueItem,
  allArticles,
  followers,
  following,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('reading');

  // Pick a random highlight once on mount (lazy initializer, no effect)
  const [highlight] = useState<Article | null>(() => {
    if (allArticles && allArticles.length > 0) {
      const randomIndex = Math.floor(Math.random() * allArticles.length);
      return allArticles[randomIndex];
    }
    return null;
  });

  const filteredArticles = activeTag
    ? articles.filter((a) => a.tags?.includes(activeTag))
    : articles;

  const sortedTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]);

  const maxStatCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <>
      {/* Highlight card */}
      {highlight && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-surface-800 rounded-2xl border border-surface-700/50 p-5 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-700 flex-shrink-0">
              {highlight.thumbnail_url ? (
                <Image
                  src={highlight.thumbnail_url}
                  alt=""
                  width={64}
                  height={64}
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
              <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">
                Highlight
              </p>
              <p className="text-surface-200 text-sm line-clamp-2">
                {highlight.summary}
              </p>
            </div>
            {highlight.source_url && (
              <a
                href={highlight.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-400 hover:underline text-sm flex-shrink-0"
              >
                Read
              </a>
            )}
          </div>
        </div>
      )}

      {/* Currently Sifting bar */}
      {queueItem && activeTab === 'reading' && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-accent-400/10 border border-accent-400/30 rounded-xl p-3 flex items-center gap-3 text-sm text-accent-400">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
            <span className="font-medium">Currently Sifting:</span>
            <span className="text-surface-300 truncate">{queueItem.url}</span>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex gap-1 border-b border-surface-700/50 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-accent-400'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="profile-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-400"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Reading List Tab */}
        {activeTab === 'reading' && (
          <div>
            {activeTag && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-surface-300">Filtering by tag:</span>
                <span className="bg-accent-400/10 text-accent-400 px-2 py-1 rounded-full text-sm">
                  #{activeTag}
                </span>
                <Link
                  href={`/profile/${username}`}
                  className="text-xs text-surface-400 underline"
                >
                  Clear
                </Link>
              </div>
            )}
            {filteredArticles.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <p className="text-surface-400">
                  {activeTag
                    ? `No articles tagged with "${activeTag}".`
                    : 'No public articles yet.'}
                </p>
              </GlassCard>
            ) : (
              <div className="grid gap-5">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-surface-800 rounded-2xl border border-surface-700/50 p-5 transition-shadow hover:shadow-card"
                  >
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
                        <a
                          href={article.source_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <p className="text-surface-200 leading-relaxed line-clamp-2">
                            {article.summary}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-surface-400">
                              {article.verdict}
                            </span>
                            <span className="text-xs text-surface-500">·</span>
                            <span className="text-xs text-surface-400">
                              {new Date(article.created_at).toLocaleDateString()}
                            </span>
                            {article.reading_time && (
                              <>
                                <span className="text-xs text-surface-500">·</span>
                                <span className="text-xs text-surface-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {article.reading_time} min
                                </span>
                              </>
                            )}
                          </div>
                        </a>
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.map((tag: string) => (
                              <Link
                                key={tag}
                                href={`/profile/${username}?tag=${encodeURIComponent(tag)}`}
                                className="text-xs bg-surface-700/50 px-2 py-0.5 rounded-full text-surface-400 hover:bg-accent-400/10 hover:text-accent-400 transition"
                              >
                                #{tag}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-2 flex-shrink-0">
                        {article.source_url && (
                          <a
                            href={article.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-400 hover:underline text-sm flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div>
            {uniqueTags === 0 ? (
              <GlassCard className="p-10 text-center">
                <p className="text-surface-400">No tags yet.</p>
              </GlassCard>
            ) : (
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-surface-50 mb-4">All Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {sortedTags.map(([tag, count]) => (
                    <Link
                      key={tag}
                      href={`/profile/${username}?tag=${encodeURIComponent(tag)}`}
                      className="px-3 py-1.5 rounded-full bg-surface-800 hover:bg-accent-400/10 transition-all text-surface-300 text-sm border border-surface-700/50"
                      style={{ fontSize: `${Math.max(12, 12 + count * 1.5)}px` }}
                    >
                      #{tag} ({count})
                    </Link>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Following list */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-surface-300 mb-3">
                Following ({followingCount})
              </h3>
              {following.length === 0 ? (
                <p className="text-xs text-surface-400">Not following anyone yet.</p>
              ) : (
                <div className="space-y-2">
                  {following.map((f) => (
                    <Link
                      key={f.following_id}
                      href={`/profile/${f.username}`}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-700/50 transition"
                    >
                      <div className="w-7 h-7 rounded-full bg-surface-700 overflow-hidden flex-shrink-0">
                        {f.avatar_url ? (
                          <Image
                            src={f.avatar_url}
                            alt=""
                            width={28}
                            height={28}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-surface-400">
                            {f.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-surface-200">@{f.username}</span>
                    </Link>
                  ))}
                </div>
              )}
              {followingCount > following.length && (
                <Link
                  href="/following"
                  className="inline-flex items-center gap-1 text-accent-400 hover:underline text-xs mt-3"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </GlassCard>

            {/* Followers list */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-surface-300 mb-3">
                Followers ({followerCount})
              </h3>
              {followers.length === 0 ? (
                <p className="text-xs text-surface-400">No followers yet.</p>
              ) : (
                <div className="space-y-2">
                  {followers.map((f) => (
                    <Link
                      key={f.follower_id}
                      href={`/profile/${f.username}`}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-700/50 transition"
                    >
                      <div className="w-7 h-7 rounded-full bg-surface-700 overflow-hidden flex-shrink-0">
                        {f.avatar_url ? (
                          <Image
                            src={f.avatar_url}
                            alt=""
                            width={28}
                            height={28}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-surface-400">
                            {f.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-surface-200">@{f.username}</span>
                    </Link>
                  ))}
                </div>
              )}
              {/* No View all for followers yet */}
            </GlassCard>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <GlassCard className="text-center p-4">
                <div className="text-2xl font-bold text-accent-400">{totalArticles}</div>
                <div className="text-xs text-surface-400">articles kept</div>
              </GlassCard>
              <GlassCard className="text-center p-4">
                <div className="text-2xl font-bold text-accent-400">{uniqueTags}</div>
                <div className="text-xs text-surface-400">unique tags</div>
              </GlassCard>
              <GlassCard className="text-center p-4">
                <div className="text-2xl font-bold text-accent-400">{streak}</div>
                <div className="text-xs text-surface-400">current streak</div>
              </GlassCard>
              <GlassCard className="text-center p-4">
                <div className="text-2xl font-bold text-accent-400">∞</div>
                <div className="text-xs text-surface-400">curiosity</div>
              </GlassCard>
            </div>

            {/* Monthly chart */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Articles kept per month
              </h3>
              <div className="flex items-end gap-2 h-32">
                {stats.map((stat) => (
                  <div key={stat.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-surface-400">{stat.count}</span>
                    <div
                      className="w-full bg-accent-400/30 rounded-t-md transition-all"
                      style={{
                        height: `${(stat.count / maxStatCount) * 80}%`,
                        minHeight: '4px',
                      }}
                    />
                    <span className="text-xs text-surface-500 mt-1">{stat.month}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}