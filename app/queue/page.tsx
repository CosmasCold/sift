'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Play, PlayCircle, Clock, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';

interface QueuedItem {
  id: string;
  url: string;
  created_at: string;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sifting, setSifting] = useState<string | null>(null);

  const fetchQueue = () => {
    fetch('/api/queue')
      .then((r) => r.json())
      .then((d) => setQueue(d.queue || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const removeItem = async (id: string) => {
    await fetch('/api/queue', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setQueue((prev) => prev.filter((i) => i.id !== id));
    toast.success('Removed from queue');
  };

  const siftNow = async (id: string, url: string) => {
    setSifting(id);
    try {
      const res = await fetch('/api/sift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        // Save and remove from queue
        await fetch('/api/save-sift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            sourceUrl: data.sourceUrl || url,
            summary: data.summary,
            insight: data.insight,
            verdict: data.verdict,
            readingTime: data.readingTime,
          }),
        });
        setQueue((prev) => prev.filter((i) => i.id !== id));
        toast.success('Sifted! Check your Library.');
      }
    } catch {
      toast.error('Sift failed');
    } finally {
      setSifting(null);
    }
  };

  const siftAll = async () => {
    setLoading(true);
    let count = 0;
    for (const item of queue) {
      try {
        const res = await fetch('/api/sift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url }),
        });
        const data = await res.json();
        if (!data.error) {
          await fetch('/api/save-sift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: item.url,
              sourceUrl: data.sourceUrl || item.url,
              summary: data.summary,
              insight: data.insight,
              verdict: data.verdict,
              readingTime: data.readingTime,
            }),
          });
          await fetch('/api/queue', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id }),
          });
          count++;
        }
      } catch {}
    }
    setLoading(false);
    fetchQueue();
    if (count > 0) {
      toast.success(`${count} article${count > 1 ? 's' : ''} sifted!`);
    } else {
      toast.error('Could not sift articles');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center pt-16">
        <div className="animate-spin w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-surface-50">Your Queue</h1>
        {queue.length > 0 && (
          <button
            onClick={siftAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-medium hover:bg-accent-600 disabled:opacity-50 transition"
          >
            <PlayCircle className="w-4 h-4" />
            Sift all ({queue.length})
          </button>
        )}
      </div>

      {queue.length === 0 ? (
                <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard className="p-10 text-center">
            <div className="mx-auto mb-6 w-20 h-20">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Envelope body */}
                <rect x="18" y="28" width="44" height="30" rx="4" fill="var(--surface-700)" />
                <path d="M18 28 L40 44 L62 28" stroke="var(--surface-500)" strokeWidth="2" fill="none" />
                {/* Clock circle */}
                <circle cx="50" cy="18" r="14" fill="var(--surface-800)" stroke="var(--surface-600)" strokeWidth="2" />
                {/* Clock hands */}
                <path d="M50 18 L50 11" stroke="var(--surface-300)" strokeWidth="2" strokeLinecap="round" />
                <path d="M50 18 L57 18" stroke="var(--surface-300)" strokeWidth="2" strokeLinecap="round" />
                {/* Small sparkle */}
                <circle cx="62" cy="11" r="1.5" fill="var(--accent-400)" opacity="0.7" />
              </svg>
            </div>
            <p className="text-surface-300 text-lg font-medium mb-1">
              Your queue is empty
            </p>
            <p className="text-surface-400 text-sm mb-4">
              Save links to sift later — from the home screen or right from your phone.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-400/10 text-accent-400 rounded-xl text-sm font-medium hover:bg-accent-400/20 transition"
            >
              Go to home
            </Link>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
          className="space-y-3"
        >
          {queue.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 },
              }}
            >
              <GlassCard variant="interactive" className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0 mr-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-surface-200 hover:text-accent-400 transition truncate block"
                  >
                    {item.url}
                  </a>
                  <p className="text-xs text-surface-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => siftNow(item.id, item.url)}
                    disabled={sifting === item.id}
                    className="p-2 rounded-lg bg-accent-400/10 text-accent-400 hover:bg-accent-400/20 transition disabled:opacity-50"
                    title="Sift now"
                  >
                    {sifting === item.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-lg text-surface-400 hover:text-red-400 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}