'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User } from 'lucide-react';

interface Profile {
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/explore?q=${encodeURIComponent(query.trim())}`);
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
      <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">Explore public profiles</h1>
      <p className="text-stone-500 mb-6">Find readers with similar interests.</p>

      {/* Search bar */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search by username..."
            className="w-full pl-9 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-stone-200 rounded-xl focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || query.trim().length < 2}
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
              {query ? `No public profiles found for "${query}"` : 'Enter a username to search'}
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