'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, LogOut, Settings, Library, Rss, Users, Inbox, Flame, Tag, Compass } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{
    username: string;
    avatar_url: string | null;
    public_profile: boolean;
  } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('username, avatar_url, public_profile')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('user_profiles')
          .select('username, avatar_url, public_profile')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else setProfile(null);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="border-b border-surface-700/50 bg-surface-800/60 backdrop-blur-xl px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/sift-logo.png"
            alt="Sift logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-semibold text-surface-50">Sift</span>
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <Link href="/library" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Library className="w-4 h-4" /> Library
            </Link>
            <Link href="/queue" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Inbox className="w-4 h-4" /> Queue
            </Link>
            <Link href="/feeds" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Rss className="w-4 h-4" /> Feeds
            </Link>
            <Link href="/discover" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Compass className="w-4 h-4" /> Discover
            </Link>
            <Link href="/explore" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Users className="w-4 h-4" /> Explore
            </Link>
            <Link href="/following" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Users className="w-4 h-4" /> Following
            </Link>
            <Link href="/trending" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Flame className="w-4 h-4" /> Trending
            </Link>
            <Link href="/tags" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Tag className="w-4 h-4" /> Tags
            </Link>
            {profile?.username && profile?.public_profile && (
              <Link href={`/profile/${profile.username}`} className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
                <User className="w-4 h-4" /> Profile
              </Link>
            )}
            <Link href="/settings" className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1">
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <div className="flex items-center gap-2 ml-2">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="avatar"
                  width={24}
                  height={24}
                  unoptimized
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-accent-400/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent-400" />
                </div>
              )}
              <span className="text-sm text-surface-300">
                {profile?.username || user.email?.split('@')[0] || 'User'}
              </span>
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="text-surface-400 hover:text-red-400 transition ml-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/auth"
            className="text-sm bg-accent-500 text-white px-4 py-2 rounded-xl hover:bg-accent-600 transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}