'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Check, Search } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import toast from 'react-hot-toast';

interface LibraryArticle {
  id: string;
  summary: string;
  kept: boolean;
}

export default function NewCollectionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [articles, setArticles] = useState<LibraryArticle[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(data => setArticles((data.articles || []).filter((a: LibraryArticle) => a.kept)))
      .catch(() => toast.error('Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  const filteredLibrary = articles.filter(a =>
    a.summary.toLowerCase().includes(filterText.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredLibrary.map(a => a.id);
    setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('Select at least one article');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), articleIds: selectedIds }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Collection created!');
      router.push(`/collections/${data.id}`);
    } else {
      toast.error(data.error || 'Failed to create collection');
    }
    setSaving(false);
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
      <Link href="/collections" className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="text-2xl font-semibold text-surface-50 mb-6">Create a Collection</h1>

      <GlassCard className="p-6 space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-surface-300 block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Climate Tech Reads"
            className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-surface-300 block mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="A short description of this collection…"
            rows={3}
            className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none resize-y"
          />
        </div>
      </GlassCard>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-surface-50">
          Select articles ({selectedIds.length} selected)
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={selectAllVisible} className="text-xs text-accent-400 hover:underline">
            Select all
          </button>
          <button onClick={clearSelection} className="text-xs text-surface-400 hover:underline">
            Clear
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          type="text"
          placeholder="Filter articles…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
        />
      </div>

      <div className="space-y-3 mb-6">
        {filteredLibrary.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <p className="text-surface-400">
              {filterText ? 'No articles match your filter.' : 'No kept articles in your library yet.'}
            </p>
          </GlassCard>
        ) : (
          filteredLibrary.map(article => {
            const isSelected = selectedIds.includes(article.id);
            return (
              <GlassCard
                key={article.id}
                variant="interactive"
                className={`p-4 cursor-pointer ${isSelected ? 'border-accent-400/50 bg-accent-400/5' : ''}`}
                onClick={() => toggleSelect(article.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-accent-400 border-accent-400' : 'border-surface-500'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-sm text-surface-200 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      <button
        onClick={handleCreate}
        disabled={saving || !title.trim() || selectedIds.length === 0}
        className="w-full py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {saving ? 'Creating…' : 'Create Collection'}
      </button>
    </main>
  );
}