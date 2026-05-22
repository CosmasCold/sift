'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  GitMerge,
  X,
  Check,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';

interface Tag {
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Rename state
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Merge state
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');

  // Fetch tags on mount – no synchronous setState
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetch('/api/tags');
        const data = await res.json();
        setTags(data.tags || []);
      } catch {
        toast.error('Failed to load tags');
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, []);

  // Refresh tags (used after rename, merge, delete)
  const fetchTags = () => {
    setLoading(true);
    fetch('/api/tags')
      .then(r => r.json())
      .then(d => {
        setTags(d.tags || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load tags');
        setLoading(false);
      });
  };

  const handleRename = async (oldName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingTag(null);
      return;
    }
    try {
      const res = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: newName.trim() }),
      });
      if (res.ok) {
        toast.success(`Renamed to "${newName.trim()}"`);
        fetchTags();
      } else {
        toast.error('Failed to rename');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setEditingTag(null);
    setNewName('');
  };

  const handleDelete = async (tag: string) => {
    if (!window.confirm(`Delete the tag "${tag}" from all articles?`)) return;
    try {
      const res = await fetch('/api/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });
      if (res.ok) {
        toast.success(`Deleted "${tag}"`);
        fetchTags();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget.trim()) return;
    if (mergeSource === mergeTarget.trim()) {
      toast.error('Cannot merge a tag into itself');
      return;
    }
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: mergeSource, target: mergeTarget.trim() }),
      });
      if (res.ok) {
        toast.success(`Merged "${mergeSource}" into "${mergeTarget.trim()}"`);
        fetchTags();
      } else {
        toast.error('Failed to merge');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setMergeSource(null);
    setMergeTarget('');
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
      <h1 className="text-2xl font-semibold text-surface-50 mb-6">Tag Manager</h1>

      {tags.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-surface-400">No tags yet. Add tags to your articles from the Library.</p>
        </GlassCard>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="space-y-3"
        >
          {tags.map(tag => (
            <motion.div
              key={tag.name}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <GlassCard className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {editingTag === tag.name ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRename(tag.name);
                      }}
                      className="flex items-center gap-2 flex-1"
                    >
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={tag.name}
                        autoFocus
                        className="flex-1 px-2 py-1 text-sm bg-surface-800/50 border border-surface-700 rounded-lg text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 text-green-400 hover:bg-surface-700 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTag(null);
                          setNewName('');
                        }}
                        className="p-1 text-surface-400 hover:bg-surface-700 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="bg-accent-400/10 text-accent-400 px-3 py-1 rounded-full text-sm font-medium">
                        #{tag.name}
                      </span>
                      <span className="text-xs text-surface-400">
                        {tag.count} article{tag.count !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
                {editingTag !== tag.name && mergeSource !== tag.name && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTag(tag.name);
                        setNewName(tag.name);
                      }}
                      className="p-1.5 text-surface-400 hover:text-surface-200 rounded hover:bg-surface-700/50"
                      title="Rename"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMergeSource(tag.name)}
                      className="p-1.5 text-surface-400 hover:text-accent-400 rounded hover:bg-surface-700/50"
                      title="Merge into another tag"
                    >
                      <GitMerge className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.name)}
                      className="p-1.5 text-surface-400 hover:text-red-400 rounded hover:bg-surface-700/50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Merge input row (appears when merging) */}
                {mergeSource === tag.name && (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-surface-400">into</span>
                    <input
                      type="text"
                      value={mergeTarget}
                      onChange={(e) => setMergeTarget(e.target.value)}
                      placeholder="target tag"
                      className="px-2 py-1 text-sm bg-surface-800/50 border border-surface-700 rounded-lg text-surface-50 placeholder-surface-500 w-32"
                      autoFocus
                    />
                    <button
                      onClick={handleMerge}
                      className="p-1 text-green-400 hover:bg-surface-700 rounded"
                      title="Confirm merge"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setMergeSource(null);
                        setMergeTarget('');
                      }}
                      className="p-1 text-surface-400 hover:bg-surface-700 rounded"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}