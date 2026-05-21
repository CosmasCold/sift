'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, Tag } from 'lucide-react';

interface Profile {
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export default function ExplorePage() {
  const [searchMode, setSearchMode] = useState<'username' | 'tag'>('username');
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (searchMode === 'username' && trimmed.length < 2) return;
    if (searchMode === 'tag' && trimmed.length < 1) return;

    setLoading(true);
    setSearched(true);
    try {
      const param = searchMode === 'username' ? `q=${encodeURIComponent(trimmed)}` : `tag=${encodeURIComponent(trimmed)}`;
      const res = await fetch(`/api/explore?${param}`);
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('Search error:', err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-sans font-bold text-stone-800 mb-2">Explore public profiles</h1>
      <p className="text-stone-500 mb-6">Find readers by username or by tag (e.g., AI, design).</p>

      {/* Search mode toggle */}
      <div className="flex gap-4 mb-4">
  <label className="flex items-center gap-2 text-sm text-stone-800 text-stone-200">
    <input
      type="radio"
      checked={searchMode === 'username'}
      onChange={() => setSearchMode('username')}
      className="accent-accent"
    />
    Search by username
  </label>
  <label className="flex items-center gap-2 text-sm text-stone-800 text-stone-200">
    <input
      type="radio"
      checked={searchMode === 'tag'}
      onChange={() => setSearchMode('tag')}
      className="accent-accent"
    />
    Search by tag
  </label>
</div>

      {/* Search bar */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          {searchMode === 'username' ? (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          ) : (
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={searchMode === 'username' ? 'Search by username...' : 'Search by tag (e.g., AI, productivity)...'}
            className="w-full pl-9 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-stone-200 rounded-xl focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || (searchMode === 'username' && query.trim().length < 2) || (searchMode === 'tag' && query.trim().length < 1)}
          className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <>
          {loading ? (
            <div className="text-center py-12 text-stone-500">Searching...</div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              {query ? `No public profiles found ${searchMode === 'username' ? `for "${query}"` : `with tag "${query}"`}` : 'Enter a search term'}
            </div>
          ) : (
            <div className="grid gap-3">
              {profiles.map((profile) => (
                <Link
                  key={profile.username}
                  href={`/profile/${profile.username}`}
                  className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-stone-200 hover:bg-white transition-colors"
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={40}
                      height={40}
                      unoptimized
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-stone-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-stone-800">@{profile.username}</p>
                    <p className="text-xs text-stone-400">
                      Reader since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}