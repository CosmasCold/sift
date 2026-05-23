'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ExternalLink, Rss, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

interface FeedSuggestion {
  title: string;
  description: string;
  url: string;
  type: 'rss' | 'substack';
}

const categories: { name: string; icon: string; feeds: FeedSuggestion[] }[] = [
  {
    name: 'Tech & Startups',
    icon: '💻',
    feeds: [
      {
        title: 'Stratechery by Ben Thompson',
        description: 'Deep analysis of tech strategy and business models.',
        url: 'https://stratechery.com/feed/',
        type: 'rss',
      },
      {
        title: 'The Pragmatic Engineer',
        description: 'Honest, detailed software engineering culture and practices.',
        url: 'https://newsletter.pragmaticengineer.com/feed',
        type: 'rss',
      },
      {
        title: 'Lenny’s Newsletter',
        description: 'Product, growth, and career advice for tech professionals.',
        url: 'https://www.lennysnewsletter.com/feed',
        type: 'rss',
      },
    ],
  },
  {
    name: 'Culture & Design',
    icon: '🎨',
    feeds: [
      {
        title: 'The Marginalian by Maria Popova',
        description: 'Cross-disciplinary essays on art, science, and the human spirit.',
        url: 'https://www.themarginalian.org/feed/',
        type: 'rss',
      },
      {
        title: 'Dense Discovery',
        description: 'A weekly collection of thought-provoking design and tech links.',
        url: 'https://www.densediscovery.com/feed/',
        type: 'rss',
      },
      {
        title: 'The B-Side by James Clear',
        description: 'Short, practical thoughts on habits and human behaviour.',
        url: 'https://jamesclear.com/feed',
        type: 'rss',
      },
    ],
  },
  {
    name: 'Science & Nature',
    icon: '🔬',
    feeds: [
      {
        title: 'Quanta Magazine',
        description: 'Beautifully explained developments in math, physics, biology.',
        url: 'https://www.quantamagazine.org/feed/',
        type: 'rss',
      },
      {
        title: 'Anthropocene Magazine',
        description: 'Reporting on human-driven environmental change.',
        url: 'https://www.anthropocenemagazine.org/feed/',
        type: 'rss',
      },
      {
        title: 'The Crux by Discover Magazine',
        description: 'Curated science and health stories from Discover Magazine.',
        url: 'https://www.discovermagazine.com/feed',
        type: 'rss',
      },
    ],
  },
  {
    name: 'News & General Interest',
    icon: '📰',
    feeds: [
      {
        title: 'The Guardian – Long Read',
        description: 'In-depth articles covering a wide range of topics.',
        url: 'https://www.theguardian.com/news/series/the-long-read/rss',
        type: 'rss',
      },
      {
        title: 'Aeon Magazine',
        description: 'Essays and ideas that explore the big questions.',
        url: 'https://aeon.co/feed.rss',
        type: 'rss',
      },
      {
        title: 'NPR Fresh Air',
        description: 'Interviews with thought leaders across arts and news.',
        url: 'https://www.npr.org/rss/podcast.php?id=13',
        type: 'rss',
      },
    ],
  },
];

function DiscoverInner() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success('Feed URL copied! Add it in Feeds.');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error('Could not copy URL.');
    }
  };

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-surface-50 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent-400" />
          Discover Feeds
        </h1>
        <p className="text-surface-400 mt-2">
          Great public Substacks and RSS feeds to get you started. Copy any URL and paste it into your{' '}
          <Link href="/feeds" className="text-accent-400 hover:underline">
            Feeds
          </Link>{' '}
          page.
        </p>
      </div>

      <div className="space-y-10">
        {categories.map((category) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-surface-50 mb-4 flex items-center gap-2">
              <span>{category.icon}</span> {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.feeds.map((feed) => (
                <GlassCard key={feed.url} variant="interactive" className="p-5">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Rss className="w-4 h-4 text-accent-400" />
                        <h3 className="text-sm font-semibold text-surface-50 leading-tight">
                          {feed.title}
                        </h3>
                      </div>
                      <p className="text-xs text-surface-400 mb-4">{feed.description}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => copyToClipboard(feed.url)}
                        className="flex items-center gap-1 text-xs font-medium text-surface-300 hover:text-accent-400 transition"
                      >
                        {copiedUrl === feed.url ? (
                          <Check className="w-3 h-3 text-verdict-green" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedUrl === feed.url ? 'Copied!' : 'Copy URL'}
                      </button>
                      {feed.url.startsWith('http') && (
                        <a
                          href={feed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-surface-400 hover:text-surface-200 ml-auto"
                          title="Visit feed"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
}

export default function DiscoverPage() {
  return (
    <AuthGuard>
      <DiscoverInner />
    </AuthGuard>
  );
}