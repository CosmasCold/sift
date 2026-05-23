'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import StarButton from '@/components/StarButton';
import toast from 'react-hot-toast';

interface Collection {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  created_at: string;
  curator: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/collections/public')
      .then(r => r.json())
      .then(data => setCollections(data.collections || []))
      .catch(() => toast.error('Failed to load collections'))
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
    <main className="flex-1 pt-12 pb-16 px-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-surface-50 flex items-center gap-2">
            <Layers className="w-6 h-6 text-accent-400" />
            Collections
          </h1>
          <p className="text-surface-400 mt-2">
            Themed reading lists curated by the Sift community.
          </p>
        </div>
        <Link
          href="/collections/new"
          className="px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-medium hover:bg-accent-600 transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Create
        </Link>
      </div>

      {collections.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Layers className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-300 text-lg font-medium mb-1">No collections yet.</p>
          <p className="text-surface-400 text-sm mb-4">Be the first to create a themed reading list.</p>
          <Link
            href="/collections/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-400/10 text-accent-400 rounded-xl text-sm font-medium hover:bg-accent-400/20 transition"
          >
            <Plus className="w-4 h-4" /> Create a collection
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
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {collections.map(collection => (
            <motion.div
              key={collection.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <GlassCard variant="interactive" className="p-5 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-surface-50 mb-1">{collection.title}</h3>
                    {collection.description && (
                      <p className="text-xs text-surface-400 line-clamp-2 mb-2">{collection.description}</p>
                    )}
                  </div>
                  <div className="mt-auto">
                    <p className="text-xs text-surface-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> @{collection.curator}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <StarButton collectionId={collection.id} />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}