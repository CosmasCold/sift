'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';

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
      <h1 className="text-2xl font-serif font-bold text-stone-800 mb-6">Your Feeds</h1>
      <div className="flex gap-2 mb-6">
        <input
          type="url"
          placeholder="RSS or Substack URL"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          className="flex-1 px-3 py-2 bg-white rounded-xl border border-stone-200"
        />
        <button
          onClick={addFeed}
          className="px-4 py-2 bg-accent text-white rounded-xl flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="space-y-3">
        {feeds.map((feed) => (
          <div
            key={feed.id}
            className="flex items-center justify-between bg-white rounded-xl p-3 border border-stone-200"
          >
            <span className="text-sm text-stone-700">{feed.title || feed.feed_url}</span>
            <button onClick={() => removeFeed(feed.id)} className="text-stone-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {feeds.length === 0 && (
          <p className="text-stone-500 text-sm text-center py-8">
            No feeds yet. Add an RSS or Substack URL to auto‑sift new posts.
          </p>
        )}
      </div>
    </main>
  );
}