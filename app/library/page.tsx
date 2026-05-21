'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Trash2, BookOpen, ThumbsUp, ThumbsDown, Search, Archive, CheckCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function LibraryPage() {
  const [articles, setArticles] = useState<SiftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'kept' | 'discarded'>('kept');
  const [search, setSearch] = useState('');
  const [feedFilter, setFeedFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(data => setArticles(data.articles || []))
      .catch(() => toast.error('Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  const toggleKeep = async (id: string, currentKept: boolean) => {
    const newKept = !currentKept;
    setArticles(prev => prev.map(a => (a.id === id ? { ...a, kept: newKept } : a)));
    try {
      await fetch('/api/toggle-keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, kept: newKept }),
      });
    } catch {
      setArticles(prev => prev.map(a => (a.id === id ? { ...a, kept: currentKept } : a)));
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/delete-sift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setArticles(prev => prev.filter(a => a.id !== id));
      toast.success('Removed');
    } else {
      toast.error('Failed to delete');
    }
  };

  const handleFeedback = async (id: string, feedback: 'agree' | 'disagree') => {
    const current = articles.find(a => a.id === id);
    if (!current) return;
    const newFeedback = current.feedback === feedback ? null : feedback;
    setArticles(prev => prev.map(a => (a.id === id ? { ...a, feedback: newFeedback } : a)));
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, feedback: newFeedback }),
    });
    if (!res.ok) {
      setArticles(prev => prev.map(a => (a.id === id ? { ...a, feedback: current.feedback } : a)));
      toast.error('Failed to save feedback');
    }
  };

  const updateTags = async (articleId: string, newTags: string[]) => {
    const res = await fetch('/api/update-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, tags: newTags }),
    });
    if (res.ok) {
      setArticles(prev => prev.map(a => (a.id === articleId ? { ...a, tags: newTags } : a)));
      toast.success('Tags updated');
    } else {
      toast.error('Failed to update tags');
    }
  };

  const filteredByStatus = articles.filter(a => {
    if (filter === 'kept') return a.kept;
    if (filter === 'discarded') return !a.kept;
    return true;
  });

  const filteredBySearch = filteredByStatus.filter(a =>
    a.summary.toLowerCase().includes(search.toLowerCase())
  );

  const finalFiltered = feedFilter === 'all'
    ? filteredBySearch
    : filteredBySearch.filter(a => a.feed?.id === feedFilter);

  const grouped = useMemo(() => {
    const groups: Record<string, SiftEntry[]> = {};
    for (const article of finalFiltered) {
      const group = getDateGroup(new Date(article.created_at));
      if (!groups[group]) groups[group] = [];
      groups[group].push(article);
    }
    return groups;
  }, [finalFiltered]);

  const feedsList = useMemo(() => {
    const feeds = new Map<string, string>();
    articles.forEach(a => {
      if (a.feed?.id && a.feed.title) {
        feeds.set(a.feed.id, a.feed.title);
      }
    });
    return Array.from(feeds.entries()).map(([id, title]) => ({ id, title }));
  }, [articles]);

  const verdictDot = {
    'Worth a full read': 'bg-verdict-green',
    'Skim this': 'bg-verdict-amber',
    'You can skip this': 'bg-verdict-grey',
  };

  if (loading) {
    return (
      <main className="flex-1 pt-16 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto" />
      </main>
    );
  }

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-md rounded-2xl border border-stone-200/60 shadow-lg px-6 py-4 mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <h1 className="text-2xl font-serif font-bold text-stone-800">Your Library</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500 bg-white/80 rounded-full px-3 py-1">
            {articles.length} sifted
          </span>
          <button
            onClick={async () => {
              const res = await fetch('/api/surprise');
              const data = await res.json();
              if (data.article) {
                setExpandedId(data.article.id);
                setFilter('all');
                setSearch('');
                toast.success('Found one!');
                setTimeout(() => {
                  const el = document.getElementById(`article-${data.article.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              } else {
                toast.error('Nothing to surprise you with');
              }
            }}
            className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Surprise Me
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Kept', value: 'kept' as const },
              { label: 'Discarded', value: 'discarded' as const },
              { label: 'All', value: 'all' as const },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === value
                    ? 'bg-accent text-white'
                    : 'bg-white/70 backdrop-blur-sm border border-stone-200 text-stone-600 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search summaries…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        {feedsList.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={feedFilter}
              onChange={e => setFeedFilter(e.target.value)}
              className="px-3 py-2 bg-white/70 backdrop-blur-sm border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-accent"
            >
              <option value="all">All sources</option>
              {feedsList.map(feed => (
                <option key={feed.id} value={feed.id}>{feed.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {finalFiltered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl border border-stone-200/60 shadow-lg px-6 py-10 text-center"
        >
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 text-sm">Nothing found.</p>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(grouped).map(([groupName, groupArticles]) => (
            <div key={groupName}>
              <h2 className="text-sm font-semibold text-stone-500 mb-3 px-1">{groupName}</h2>
              <div className="grid gap-4">
                {groupArticles.map((article) => (
                  <motion.div
                    id={`article-${article.id}`}
                    key={article.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white/90 backdrop-blur-sm rounded-2xl border p-5 transition-shadow ${
                      !article.kept ? 'border-stone-200/60 opacity-70' : 'border-stone-200/80'
                    } shadow-[0_2px_8px_rgba(91,75,138,0.04)] hover:shadow-[0_4px_16px_rgba(91,75,138,0.08)]`}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-3 w-full">
                      <div className="flex items-start gap-2 min-w-0 flex-1 w-full">
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${verdictDot[article.verdict]}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-stone-700 break-words line-clamp-2">
                            {article.summary}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {new Date(article.created_at).toLocaleDateString()}
                            {article.feed?.title && ` · from ${article.feed.title}`}
                          </p>
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {article.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                        <button onClick={() => toggleKeep(article.id, article.kept)} className="p-1 rounded-md transition-colors" title={article.kept ? 'Discard' : 'Keep'}>
                          {article.kept ? <CheckCircle className="w-4 h-4 text-verdict-green" /> : <Archive className="w-4 h-4 text-stone-400" />}
                        </button>
                        <button onClick={() => handleFeedback(article.id, 'agree')} className={`p-1 rounded-md ${article.feedback === 'agree' ? 'text-verdict-green' : 'text-stone-400'}`}>
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleFeedback(article.id, 'disagree')} className={`p-1 rounded-md ${article.feedback === 'disagree' ? 'text-verdict-amber' : 'text-stone-400'}`}>
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpandedId(expandedId === article.id ? null : article.id)} className="text-accent hover:underline text-sm">
                          {expandedId === article.id ? 'Close' : 'Read'}
                        </button>
                        <button onClick={() => handleDelete(article.id)} className="text-stone-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedId === article.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-stone-100 space-y-3">
                            <p className="text-stone-700 text-sm leading-relaxed">{article.summary}</p>
                            {article.insight && (
                              <div className="bg-warm-hover/50 rounded-xl p-3 border-l-4 border-accent">
                                <p className="text-stone-700 italic text-sm">{article.insight}</p>
                              </div>
                            )}
                            {article.source_url && (
                              <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline text-sm">
                                Read original <ArrowRight className="w-3 h-3" />
                              </a>
                            )}
                            {/* Tag editor */}
                            <div className="pt-2">
                              <label className="text-xs font-medium text-stone-500 block mb-1">Tags (comma separated)</label>
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  const tagsInput = formData.get('tags')?.toString().trim();
                                  const newTags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
                                  await updateTags(article.id, newTags);
                                }}
                                className="flex gap-2"
                              >
                                <input
                                  name="tags"
                                  defaultValue={(article.tags || []).join(', ')}
                                  placeholder="e.g., AI, design, product"
                                  className="flex-1 px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-accent"
                                />
                                <button type="submit" className="px-3 py-1 text-sm bg-accent/10 text-accent rounded-lg hover:bg-accent/20">
                                  Save
                                </button>
                              </form>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}