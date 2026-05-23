'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Feed {
  id: string;
  feed_url: string;
  title: string | null;
}

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    fetch('/api/feeds')
      .then(r => r.json())
      .then(d => setFeeds((d.feeds as Feed[]) || []));
  }, []);

  const addFeed = async () => {
    if (!newUrl.trim()) return;
    const res = await fetch('/api/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedUrl: newUrl }),
    });
    const data = await res.json();
    if (data.feed) {
      setFeeds([...feeds, data.feed as Feed]);
      setNewUrl('');
      toast.success('Feed added');
    } else {
      toast.error(data.error || 'Failed');
    }
  };

  const removeFeed = async (id: string) => {
    await fetch('/api/feeds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setFeeds(feeds.filter(f => f.id !== id));
    toast.success('Feed removed');
  };

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-surface-50 mb-6">Your Feeds</h1>

      <GlassCard className="p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="RSS or Substack URL"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
          />
          <button
            onClick={addFeed}
            className="px-4 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        {feeds.length === 0 ? (
                    <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-10 text-center">
              <div className="mx-auto mb-6 w-20 h-20">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {/* Satellite dish */}
                  <ellipse cx="40" cy="44" rx="10" ry="24" fill="var(--surface-700)" />
                  <path d="M30 44 Q40 24, 50 44" stroke="var(--surface-500)" strokeWidth="2" fill="none" />
                  <line x1="40" y1="20" x2="40" y2="44" stroke="var(--surface-500)" strokeWidth="2" />
                  {/* Signal waves */}
                  <path d="M20 44 Q10 36, 20 28" stroke="var(--accent-400)" strokeWidth="2" fill="none" opacity="0.7" />
                  <path d="M14 44 Q4 36, 14 22" stroke="var(--accent-300)" strokeWidth="1.5" fill="none" opacity="0.5" />
                  {/* Sparkles */}
                  <circle cx="22" cy="24" r="1.5" fill="var(--accent-400)" opacity="0.8" />
                </svg>
              </div>
              <p className="text-surface-300 text-lg font-medium mb-1">No feeds connected yet.</p>
              <p className="text-surface-400 text-sm">
                Add an RSS or Substack URL to automatically sift new posts and keep what matters.
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="space-y-3"
          >
            {feeds.map((feed) => (
              <motion.div
                key={feed.id}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <GlassCard
                  variant="interactive"
                  className="flex items-center justify-between p-4"
                >
                  <span className="text-sm text-surface-200">
                    {feed.title || feed.feed_url}
                  </span>
                  <button
                    onClick={() => removeFeed(feed.id)}
                    className="text-surface-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}