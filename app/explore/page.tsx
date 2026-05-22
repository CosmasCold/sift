'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Tag } from 'lucide-react';

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
    } catch {
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
      <h1 className="text-3xl font-bold text-white mb-2">Explore public profiles</h1>
      <p className="text-gray-400 mb-6">Find readers by username or by tag (e.g., AI, design).</p>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-gray-300">
          <input type="radio" checked={searchMode === 'username'} onChange={() => setSearchMode('username')} className="accent-purple-500" /> Search by username
        </label>
        <label className="flex items-center gap-2 text-gray-300">
          <input type="radio" checked={searchMode === 'tag'} onChange={() => setSearchMode('tag')} className="accent-purple-500" /> Search by tag
        </label>
      </div>
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          {searchMode === 'username' ? (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          ) : (
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={searchMode === 'username' ? 'Search by username...' : 'Search by tag (e.g., AI, productivity)...'}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || (searchMode === 'username' && query.trim().length < 2) || (searchMode === 'tag' && query.trim().length < 1)}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
        >
          Search
        </button>
      </div>
      {searched && (
        loading ? (
          <div className="text-center py-12 text-gray-400">Searching...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {query ? `No public profiles found ${searchMode === 'username' ? `for "${query}"` : `with tag "${query}"`}` : 'Enter a search term'}
          </div>
        ) : (
          <div className="grid gap-3">
            {profiles.map((profile) => (
              <Link
                key={profile.username}
                href={`/profile/${profile.username}`}
                className="flex items-center gap-3 p-3 bg-gray-800/80 rounded-xl hover:bg-gray-800 transition"
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
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">@{profile.username}</p>
                  <p className="text-xs text-gray-400">
                    Reader since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </main>
  );
}