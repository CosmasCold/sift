'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Tag } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';
import UserAvatar from '@/components/UserAvatar';

interface Profile {
  username: string;
  avatar_url: string | null;
  created_at: string;
}

function ExploreInner() {
  const [searchMode, setSearchMode] = useState<'username' | 'tag'>('username');
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (searchMode === 'username' && trimmed.length < 2) return;
    if (searchMode === 'tag' && trimmed.length < 1) return;
    setLoading(true);
    setSearched(true);
    try {
      const param = searchMode === 'username' ? `q=${encodeURIComponent(trimmed)}` : `tag=${encodeURIComponent(trimmed)}`;
      const res = await fetch(`/api/explore?${param}`);
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-surface-50 mb-2">Explore public profiles</h1>
      <p className="text-surface-400 mb-6">
        Discover fellow readers by username or the topics they care about.
      </p>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-surface-300">
          <input type="radio" checked={searchMode === 'username'} onChange={() => setSearchMode('username')} className="accent-accent-400" /> Search by username
        </label>
        <label className="flex items-center gap-2 text-surface-300">
          <input type="radio" checked={searchMode === 'tag'} onChange={() => setSearchMode('tag')} className="accent-accent-400" /> Search by tag
        </label>
      </div>

      <GlassCard className="p-4 mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            {searchMode === 'username' ? (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            ) : (
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={searchMode === 'username' ? 'Search by username...' : 'Search by tag (e.g., AI, productivity)...'}
              className="w-full pl-9 pr-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || (searchMode === 'username' && query.trim().length < 2) || (searchMode === 'tag' && query.trim().length < 1)}
            className="px-4 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 disabled:opacity-50 transition"
          >
            Search
          </button>
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        {searched && (
          loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 text-surface-400">Searching...</motion.div>
          ) : profiles.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <GlassCard className="p-10 text-center">
                <div className="mx-auto mb-6 w-20 h-20">
                  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="34" cy="34" r="16" stroke="var(--surface-600)" strokeWidth="2.5" fill="var(--surface-800)" />
                    <line x1="46" y1="46" x2="58" y2="58" stroke="var(--surface-500)" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="28" cy="28" r="3" fill="var(--accent-400)" />
                    <path d="M24 34 Q28 38, 32 34" stroke="var(--accent-400)" strokeWidth="1.5" fill="none" />
                    <circle cx="40" cy="30" r="2.5" fill="var(--accent-300)" />
                    <path d="M37 35 Q40 38, 43 35" stroke="var(--accent-300)" strokeWidth="1.5" fill="none" />
                    <circle cx="60" cy="56" r="1.5" fill="var(--accent-400)" opacity="0.8" />
                  </svg>
                </div>
                <p className="text-surface-300 text-lg font-medium mb-1">
                  {query ? `No public profiles found ${searchMode === 'username' ? `for "${query}"` : `with the tag "${query}"`}.` : 'Enter a search term to find readers.'}
                </p>
                <p className="text-surface-400 text-sm">
                  {query ? 'Try a different name or tag.' : 'You can search by username or by topic tag.'}
                </p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div key="results" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }} className="grid gap-3">
              {profiles.map((profile) => (
                <motion.div key={profile.username} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                  <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 p-3 bg-surface-800/60 backdrop-blur-xl border border-surface-700/50 shadow-glass-sm rounded-2xl transition hover:bg-surface-800/80 hover:shadow-glass">
                    <UserAvatar username={profile.username} avatarKey={profile.avatar_url} size={40} />
                    <div>
                      <p className="font-medium text-surface-50">@{profile.username}</p>
                      <p className="text-xs text-surface-400">Reader since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </main>
  );
}

export default function ExplorePage() {
  return (
    <AuthGuard>
      <ExploreInner />
    </AuthGuard>
  );
}