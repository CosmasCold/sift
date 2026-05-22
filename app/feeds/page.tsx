'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

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

      <div className="space-y-3">
        {feeds.map((feed) => (
          <GlassCard
            key={feed.id}
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
        ))}
        {feeds.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-surface-400 text-sm">
              No feeds yet. Add an RSS or Substack URL to auto‑sift new posts.
            </p>
          </GlassCard>
        )}
      </div>
    </main>
  );
}