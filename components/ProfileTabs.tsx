'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
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
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('reading');

  // Filter articles by active tag if present (for tag click)
  const filteredArticles = activeTag
    ? articles.filter((a) => a.tags?.includes(activeTag))
    : articles;

  const sortedTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]);

  return (
    <>
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
                    <a
                      href={article.source_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <p className="text-surface-200 leading-relaxed">
                        {article.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-xs font-medium text-surface-400">
                          {article.verdict}
                        </span>
                        <span className="text-xs text-surface-500">·</span>
                        <span className="text-xs text-surface-400">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </a>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
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
                    {/* Action links row */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-700/50">
                      {article.source_url && (
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent-400 hover:underline text-sm"
                        >
                          Read original <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
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

        {/* Network Tab (Following / Followers) */}
        {activeTab === 'network' && (
          <div className="grid gap-6 sm:grid-cols-2">
            <GlassCard className="p-6 text-center">
              <div className="text-3xl font-bold text-accent-400 mb-2">
                {followingCount}
              </div>
              <p className="text-surface-400 text-sm mb-4">Following</p>
              <Link
                href="/following"
                className="inline-flex items-center gap-1 text-accent-400 hover:underline text-sm"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </GlassCard>
            <GlassCard className="p-6 text-center">
              <div className="text-3xl font-bold text-accent-400 mb-2">
                {followerCount}
              </div>
              <p className="text-surface-400 text-sm mb-4">Followers</p>
              <p className="text-xs text-surface-500">Coming soon</p>
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
            <GlassCard className="p-6 text-center">
              <p className="text-surface-400 text-sm">More detailed stats coming soon.</p>
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}