'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Trash2, BookOpen, ThumbsUp, ThumbsDown, Search, Archive, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
}

export default function LibraryPage() {
  const [articles, setArticles] = useState<SiftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'kept' | 'discarded'>('kept');
  const [search, setSearch] = useState('');

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

  const exportMarkdown = () => {
  const kept = articles.filter(a => a.kept);
  if (kept.length === 0) {
    toast.error('No kept articles to export');
    return;
  }

  const md = kept
    .map(
      (a) =>
        `## ${a.summary?.substring(0, 60) || 'Untitled'}\n\n` +
        `- **Verdict:** ${a.verdict}\n` +
        `- **Date:** ${new Date(a.created_at).toLocaleDateString()}\n` +
        `- **Source:** ${a.source_url || a.url || ''}\n\n` +
        `${a.summary}\n\n` +
        (a.insight ? `> ${a.insight}\n\n` : '')
    )
    .join('---\n\n');

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sift-export-${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  toast.success('Exported!');
};

  const filteredArticles = articles
    .filter(a => {
      if (filter === 'kept') return a.kept;
      if (filter === 'discarded') return !a.kept;
      return true;
    })
    .filter(a => a.summary.toLowerCase().includes(search.toLowerCase()));

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
        <span className="text-sm text-stone-500 bg-white/80 rounded-full px-3 py-1">
          {articles.length} sifted
        </span>
        <button
  onClick={async () => {
    const res = await fetch('/api/surprise');
    const data = await res.json();
    if (data.article) {
      // Show it: set the expanded ID to the random article's ID
      setExpandedId(data.article.id);
      // Switch to 'all' filter so we can see it regardless of kept/discarded
      setFilter('all');
      // Clear the search so it's not hidden
      setSearch('');
      toast.success('Found one!');
    } else {
      toast.error('Nothing to surprise you with');
    }
  }}
  className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-1"
>
  Surprise Me
</button>
      </motion.div>

<div className="flex justify-end mb-2">
  <button
    onClick={exportMarkdown}
    className="px-3 py-1.5 text-sm bg-white/70 backdrop-blur-sm border border-stone-200 rounded-xl text-stone-600 hover:bg-white transition-colors"
  >
    Export Markdown
  </button>
</div>
      {/* Filter & Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { label: 'Kept', value: 'kept' as const },
              { label: 'Discarded', value: 'discarded' as const },
              { label: 'All', value: 'all' as const },
            ]
          ).map(({ label, value }) => (
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

      {/* Empty state */}
      {filteredArticles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl border border-stone-200/60 shadow-lg px-6 py-10 text-center"
        >
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 text-sm">
            {filter === 'discarded'
              ? 'No discarded articles. You can mark any article as discarded from the Kept view.'
              : 'Nothing sifted yet. Sift an article to start your library.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 max-w-3xl mx-auto w-full">
          {filteredArticles.map((article) => (
            <motion.div
              key={article.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl border p-5 transition-shadow ${
                !article.kept ? 'border-stone-200/60 opacity-70' : 'border-stone-200/80'
              } shadow-[0_2px_8px_rgba(91,75,138,0.04)] hover:shadow-[0_4px_16px_rgba(91,75,138,0.08)]`}
            >
              <div className="flex flex-col sm:flex-row items-start gap-3 w-full">
                {/* Verdict + summary text */}
                <div className="flex items-start gap-2 min-w-0 flex-1 w-full">
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${verdictDot[article.verdict]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-700 break-words line-clamp-2">
                      {article.summary}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Button group */}
                <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                  <button
                    onClick={() => toggleKeep(article.id, article.kept)}
                    className={`p-1 rounded-md transition-colors ${
                      article.kept
                        ? 'text-verdict-green hover:text-stone-400'
                        : 'text-stone-400 hover:text-verdict-green'
                    }`}
                    title={article.kept ? 'Discard' : 'Keep'}
                  >
                    {article.kept ? <CheckCircle className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleFeedback(article.id, 'agree')}
                    className={`p-1 rounded-md transition-colors ${
                      article.feedback === 'agree'
                        ? 'text-verdict-green bg-verdict-green/10'
                        : 'text-stone-400 hover:text-verdict-green'
                    }`}
                    title="Agree with verdict"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(article.id, 'disagree')}
                    className={`p-1 rounded-md transition-colors ${
                      article.feedback === 'disagree'
                        ? 'text-verdict-amber bg-verdict-amber/10'
                        : 'text-stone-400 hover:text-verdict-amber'
                    }`}
                    title="Disagree with verdict"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                    className="text-accent hover:underline text-sm"
                  >
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
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline text-sm"
                        >
                          Read original <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}