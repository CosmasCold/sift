'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Search,
  Archive,
  CheckCircle,
  Filter,
  Clock,
  Sparkles,
  Layers,
  Download,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import Thumbnail from '@/components/Thumbnail';

interface Feed {
  id: string;
  title: string | null;
}

interface SiftEntry {
  id: string;
  url: string | null;
  source_url: string | null;
  summary: string;
  insight: string;
  verdict: 'Worth a full read' | 'Skim this' | 'You can skip this';
  feedback: 'agree' | 'disagree' | null;
  kept: boolean;
  created_at: string;
  feed: Feed | null;
  tags: string[];
  reading_time: number | null;
  thumbnail_url: string | null;
}

interface Collection {
  title: string;
  articleIds: string[];
}

const getDateGroup = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'This Week';
  return 'Earlier';
};

function LibraryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<SiftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArticle, setExpandedArticle] = useState<SiftEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'kept' | 'discarded'>('kept');
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'summary' | 'full'>('summary');
  const [fullSearchResults, setFullSearchResults] = useState<SiftEntry[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [feedFilter, setFeedFilter] = useState<string>('all');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [feedbackAnimation, setFeedbackAnimation] = useState<Record<string, number>>({});

  const tagFilter = searchParams.get('tag');
  const collectionFilter = searchParams.get('collection');

  useEffect(() => {
    fetch('/api/library')
      .then((r) => r.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => toast.error('Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (articles.length >= 2) {
      fetch('/api/collections')
        .then(r => r.json())
        .then(data => setCollections(data.collections || []))
        .catch(() => {});
    }
  }, [articles]);

  useEffect(() => {
    if (Object.keys(feedbackAnimation).length === 0) return;
    const timeout = setTimeout(() => {
      setFeedbackAnimation({});
    }, 600);
    return () => clearTimeout(timeout);
  }, [feedbackAnimation]);

  // Full‑text search effect
  useEffect(() => {
    if (searchMode !== 'full') return;

    const fetchData = async () => {
      setSearchLoading(true);
      try {
        const r = await fetch(`/api/library/search?q=${encodeURIComponent(search.trim())}`);
        const data = await r.json();
        setFullSearchResults(data.articles || []);
      } catch {
        setFullSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchData();
  }, [search, searchMode]);

  const toggleKeep = async (id: string, kept: boolean) => {
    const newKept = !kept;
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, kept: newKept } : a)));
    if (expandedArticle?.id === id) {
      setExpandedArticle(prev => prev ? { ...prev, kept: newKept } : null);
    }
    try {
      await fetch('/api/toggle-keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, kept: newKept }),
      });
    } catch {
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, kept: kept } : a)));
      if (expandedArticle?.id === id) {
        setExpandedArticle(prev => prev ? { ...prev, kept } : null);
      }
      toast.error('Failed');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/delete-sift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success('Removed');
      setExpandedArticle(null);
    } else toast.error('Failed');
  };

  const handleFeedback = async (id: string, fb: 'agree' | 'disagree') => {
    const current = articles.find((a) => a.id === id);
    if (!current) return;
    const newFb = current.feedback === fb ? null : fb;

    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, feedback: newFb } : a)));
    if (expandedArticle?.id === id) {
      setExpandedArticle(prev => prev ? { ...prev, feedback: newFb } : null);
    }
    setFeedbackAnimation((prev) => ({ ...prev, [id]: Date.now() }));

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, feedback: newFb }),
    });
    if (!res.ok) {
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, feedback: current.feedback } : a)));
      if (expandedArticle?.id === id) {
        setExpandedArticle(prev => prev ? { ...prev, feedback: current.feedback } : null);
      }
      toast.error('Failed');
    }
  };

  const updateTags = async (articleId: string, newTags: string[]) => {
    const res = await fetch('/api/update-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, tags: newTags }),
    });
    if (res.ok) {
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, tags: newTags } : a))
      );
      if (expandedArticle?.id === articleId) {
        setExpandedArticle(prev => prev ? { ...prev, tags: newTags } : null);
      }
      toast.success('Tags updated');
    } else toast.error('Failed');
  };

  const filtered = useMemo(() => {
    if (searchMode === 'full') {
      return fullSearchResults.length > 0
        ? fullSearchResults
        : articles.filter((a) => (filter === 'kept' ? a.kept : filter === 'discarded' ? !a.kept : true));
    }
    return articles
      .filter((a) => (filter === 'kept' ? a.kept : filter === 'discarded' ? !a.kept : true))
      .filter((a) => a.summary.toLowerCase().includes(search.toLowerCase()))
      .filter((a) => (tagFilter ? a.tags?.includes(tagFilter) : true))
      .filter((a) => {
        if (!collectionFilter) return true;
        const collection = collections.find(c => c.title === collectionFilter);
        return collection ? collection.articleIds.includes(a.id) : true;
      });
  }, [articles, filter, search, searchMode, fullSearchResults, tagFilter, collectionFilter, collections]);

  const final =
    feedFilter === 'all' ? filtered : filtered.filter((a) => a.feed?.id === feedFilter);

  const grouped = useMemo(() => {
    const groups: Record<string, SiftEntry[]> = {};
    for (const a of final) {
      const g = getDateGroup(new Date(a.created_at));
      if (!groups[g]) groups[g] = [];
      groups[g].push(a);
    }
    return groups;
  }, [final]);

  const feedsList = useMemo(() => {
    const feeds = new Map<string, string>();
    articles.forEach((a) => {
      if (a.feed?.id && a.feed.title) feeds.set(a.feed.id, a.feed.title);
    });
    return Array.from(feeds.entries()).map(([id, title]) => ({ id, title }));
  }, [articles]);

  const weeklyDigest = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return articles
      .filter((a) => a.kept && new Date(a.created_at) >= weekAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [articles]);

  const handleExportMd = () => {
    if (final.length === 0) {
      toast.error('No articles to export.');
      return;
    }
    const date = new Date().toISOString().split('T')[0];
    const md = final
      .map((article) => {
        const title = article.summary.substring(0, 80).replace(/\n/g, ' ') + '…';
        const verdict = `**Verdict:** ${article.verdict}`;
        const tags = article.tags?.length ? `**Tags:** ${article.tags.map(t => `#${t}`).join(' ')}` : '';
        const link = article.source_url ? `**Source:** ${article.source_url}` : '';
        const dateLine = `**Date:** ${new Date(article.created_at).toLocaleDateString()}`;
        return `## ${title}\n\n${verdict}\n${dateLine}\n${link}\n${tags}\n\n${article.summary}\n\n---\n`;
      })
      .join('\n');

    const header = `# Sift Export — ${date}\n\n`;
    const blob = new Blob([header + md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sift-export-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${final.length} articles exported.`);
  };

  if (loading)
    return (
      <div className="flex justify-center pt-16">
        <div className="animate-spin w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-6xl mx-auto">
      {/* Weekly digest preview */}
      {!loading && weeklyDigest.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-accent-400" />
              <span className="text-sm font-semibold text-surface-300">
                This week you kept {weeklyDigest.length} article
                {weeklyDigest.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {weeklyDigest.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setExpandedArticle(article)}
                  className="w-full text-left text-sm text-surface-200 hover:text-accent-400 transition line-clamp-1"
                >
                  {article.summary}
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* AI Collections */}
      {collections.length > 0 && !collectionFilter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-accent-400" />
              <span className="text-sm font-semibold text-surface-300">Collections</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {collections.map((collection) => (
                <button
                  key={collection.title}
                  onClick={() =>
                    router.push(`/library?collection=${encodeURIComponent(collection.title)}`)
                  }
                  className="px-3 py-1.5 bg-accent-400/10 text-accent-400 rounded-full text-sm font-medium hover:bg-accent-400/20 transition"
                >
                  {collection.title} ({collection.articleIds.length})
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Active collection banner */}
      {collectionFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-surface-300">Collection:</span>
          <span className="bg-accent-400/10 text-accent-400 px-2 py-1 rounded-full text-sm">
            {collectionFilter}
          </span>
          <button
            onClick={() => router.replace('/library')}
            className="text-xs text-surface-400 underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Header */}
      <GlassCard className="p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-surface-50">Your Library</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-surface-400 bg-surface-800/60 px-3 py-1 rounded-full">
            {articles.length} sifted
          </span>
          <button
            onClick={handleExportMd}
            disabled={final.length === 0}
            className="px-4 py-2 bg-surface-800/60 border border-surface-700/50 text-surface-300 rounded-xl text-sm font-medium hover:bg-surface-700/60 disabled:opacity-50 flex items-center gap-1 transition"
            aria-label="Export visible articles as Markdown"
          >
            <Download className="w-4 h-4" /> Markdown
          </button>
          <button
            onClick={async () => {
              const res = await fetch('/api/surprise');
              const data = await res.json();
              if (data.article) {
                setFilter('all');
                setSearch('');
                const found = articles.find(a => a.id === data.article.id);
                if (found) {
                  setExpandedArticle(found);
                  toast.success('Found one!');
                }
              } else toast.error('Nothing to surprise you with');
            }}
            className="px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-medium hover:bg-accent-600 transition"
          >
            Surprise Me
          </button>
        </div>
      </GlassCard>

      {/* Active tag filter banner */}
      {tagFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-surface-300">Tagged:</span>
          <span className="bg-accent-400/10 text-accent-400 px-2 py-1 rounded-full text-sm">
            #{tagFilter}
          </span>
          <button
            onClick={() => router.replace('/library')}
            className="text-xs text-surface-400 underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: 'Kept', value: 'kept' },
            { label: 'Discarded', value: 'discarded' },
            { label: 'All', value: 'all' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value as 'kept' | 'discarded' | 'all')}
              className={`px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? 'text-accent-400 border-b-2 border-accent-400'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              placeholder={searchMode === 'full' ? 'Search full text…' : 'Search summaries…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-16 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setSearchMode(searchMode === 'summary' ? 'full' : 'summary')}
                className={`text-xs px-2 py-1 rounded-lg transition ${searchMode === 'full' ? 'bg-accent-400/20 text-accent-400' : 'text-surface-400 hover:text-surface-200'}`}
                title={`Search ${searchMode === 'summary' ? 'full text' : 'summaries'}`}
              >
                {searchMode === 'full' ? 'Full' : 'TL;DR'}
              </button>
            </div>
          </div>
        </div>
        {feedsList.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-500" />
            <select
              value={feedFilter}
              onChange={(e) => setFeedFilter(e.target.value)}
              className="px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 focus:ring-2 focus:ring-accent-400/50 outline-none"
            >
              <option value="all">All sources</option>
              {feedsList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Empty State */}
      {final.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <GlassCard className="p-10 text-center">
            <div className="mx-auto mb-6 w-20 h-20">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect x="22" y="12" width="36" height="56" rx="4" fill="var(--surface-700)" />
                <rect x="26" y="16" width="28" height="8" rx="2" fill="var(--surface-500)" />
                <line x1="40" y1="16" x2="40" y2="64" stroke="var(--surface-900)" strokeWidth="2" />
                <path d="M28 32h24" stroke="var(--surface-400)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M28 40h24" stroke="var(--surface-400)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M28 48h16" stroke="var(--surface-400)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {search || feedFilter !== 'all' || tagFilter || collectionFilter ? (
              <>
                <p className="text-surface-300 text-lg font-medium mb-1">
                  No articles match your current filters.
                </p>
                <p className="text-surface-400 text-sm">
                  Try a different search term, source, tag, or collection.
                </p>
              </>
            ) : filter === 'kept' ? (
              <>
                <p className="text-surface-300 text-lg font-medium mb-1">
                  Your library is empty.
                </p>
                <p className="text-surface-400 text-sm">
                  Sift an article and keep it to start growing your collection.
                </p>
              </>
            ) : filter === 'discarded' ? (
              <>
                <p className="text-surface-300 text-lg font-medium mb-1">
                  Nothing discarded yet.
                </p>
                <p className="text-surface-400 text-sm">
                  Articles you discard will appear here.
                </p>
              </>
            ) : (
              <>
                <p className="text-surface-300 text-lg font-medium mb-1">
                  Your library is waiting.
                </p>
                <p className="text-surface-400 text-sm">
                  Sift your first article to see it here.
                </p>
              </>
            )}
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="grid gap-6"
        >
          {Object.entries(grouped).map(([groupName, articles]) => (
            <motion.div
              key={groupName}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
            >
              <h2 className="text-sm font-semibold text-surface-400 mb-3 px-1 border-b border-surface-600/30 pb-2">
                {groupName}
              </h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => {
                  return (
                    <motion.div
                      id={`article-${article.id}`}
                      key={article.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedArticle(article);
                        }
                      }}
                      onClick={() => setExpandedArticle(article)}
                      className="bg-surface-800 border border-surface-600/50 shadow-card rounded-2xl p-5 transition-shadow hover:shadow-card-hover cursor-pointer hover:-translate-y-0.5"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        <Thumbnail src={article.thumbnail_url} size={80} className="rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${
                                article.verdict === 'Worth a full read'
                                  ? 'bg-verdict-green'
                                  : article.verdict === 'Skim this'
                                  ? 'bg-verdict-amber'
                                  : 'bg-verdict-grey'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-surface-50 line-clamp-2">
                                {article.summary}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                <p className="text-xs text-surface-400">
                                  {new Date(article.created_at).toLocaleDateString()}
                                  {article.feed?.title && ` · from ${article.feed.title}`}
                                </p>
                                {article.reading_time ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-surface-500">
                                    <Clock className="w-3 h-3" />
                                    ~{article.reading_time} min read
                                  </span>
                                ) : (
                                  <span className="text-xs text-surface-500">—</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {article.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 ml-5">
                              {article.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/library?tag=${encodeURIComponent(tag)}`);
                                  }}
                                  className="text-xs bg-surface-800/60 px-2 py-0.5 rounded-full text-surface-400 hover:bg-accent-400/10 hover:text-accent-400 cursor-pointer transition"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* --- Modal overlay for expanded article --- */}
      <AnimatePresence>
        {expandedArticle && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedArticle(null)}
          >
            <motion.div
              className="bg-surface-800 border border-surface-600/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setExpandedArticle(null)}
                className="absolute top-4 right-4 p-1 text-surface-400 hover:text-surface-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-4 mb-5">
                <Thumbnail src={expandedArticle.thumbnail_url} size={80} className="rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        expandedArticle.verdict === 'Worth a full read'
                          ? 'bg-verdict-green'
                          : expandedArticle.verdict === 'Skim this'
                          ? 'bg-verdict-amber'
                          : 'bg-verdict-grey'
                      }`}
                    />
                    <span className="text-sm font-semibold text-surface-300">
                      {expandedArticle.verdict}
                    </span>
                    <span className="text-xs text-surface-400 ml-auto">
                      {new Date(expandedArticle.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-surface-200 leading-relaxed">{expandedArticle.summary}</p>
                  {expandedArticle.insight && (
                    <div className="bg-surface-800/60 rounded-xl p-3 border-l-4 border-accent-400 mt-3">
                      <p className="text-surface-300 italic text-sm">{expandedArticle.insight}</p>
                    </div>
                  )}
                </div>
              </div>

              {expandedArticle.source_url && (
                <a
                  href={expandedArticle.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent-400 hover:underline text-sm mb-4"
                >
                  Read original <ArrowRight className="w-3 h-3" />
                </a>
              )}

              {/* Tags */}
              <div className="mb-4">
                <label className="text-xs font-medium text-surface-400 block mb-1">Tags (comma separated)</label>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const input = fd.get('tags')?.toString().trim();
                    const newTags = input
                      ? input.split(',').map((t) => t.trim()).filter((t) => t)
                      : [];
                    await updateTags(expandedArticle.id, newTags);
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="tags"
                    defaultValue={(expandedArticle.tags || []).join(', ')}
                    placeholder="e.g., AI, design"
                    className="flex-1 min-w-0 max-w-full px-2 py-1 text-sm border border-surface-600 rounded-lg bg-surface-800 text-surface-50 placeholder-surface-400 focus:ring-2 focus:ring-accent-400/50 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-accent-400/10 text-accent-400 rounded-lg hover:bg-accent-400/20 transition"
                  >
                    Save
                  </button>
                </form>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-surface-700/50">
                <button
                  onClick={() => toggleKeep(expandedArticle.id, expandedArticle.kept)}
                  className={`p-2 rounded-lg ${expandedArticle.kept ? 'bg-verdict-green/10 text-verdict-green' : 'bg-surface-700/50 text-surface-400'} hover:bg-surface-700 transition`}
                >
                  {expandedArticle.kept ? <CheckCircle className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  <span className="sr-only">{expandedArticle.kept ? 'Discard' : 'Keep'}</span>
                </button>
                <button
                  onClick={() => handleFeedback(expandedArticle.id, 'agree')}
                  className={`p-2 rounded-lg ${expandedArticle.feedback === 'agree' ? 'bg-verdict-green/10 text-verdict-green' : 'bg-surface-700/50 text-surface-400'} hover:bg-surface-700 transition`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFeedback(expandedArticle.id, 'disagree')}
                  className={`p-2 rounded-lg ${expandedArticle.feedback === 'disagree' ? 'bg-verdict-amber/10 text-verdict-amber' : 'bg-surface-700/50 text-surface-400'} hover:bg-surface-700 transition`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(expandedArticle.id)}
                  className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-surface-700 transition ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function LibraryClient() {
  return (
    <AuthGuard>
      <LibraryInner />
    </AuthGuard>
  );
}