'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { Library, Compass, Flame } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import UserMenu from '@/components/UserMenu';

export default function Navbar() {
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

  return (
    <nav className="border-b border-surface-700/50 bg-surface-800/60 backdrop-blur-xl px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/sift-logo.png"
            alt="Sift logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-semibold text-surface-50 hidden sm:inline">Sift</span>
        </Link>

        {/* Core navigation */}
        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/library"
            className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1 px-2 py-1"
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </Link>

          <Link
            href="/explore"
            className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1 px-2 py-1"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Explore</span>
          </Link>

          <Link
            href="/trending"
            className="text-surface-300 hover:text-accent-400 transition flex items-center gap-1 px-2 py-1"
          >
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Trending</span>
          </Link>
        </div>

        {/* Auth / User menu */}
        <div className="flex items-center">
          {user ? (
            <UserMenu user={user} profile={profile} />
          ) : (
            <Link
              href="/auth"
              className="text-sm bg-accent-500 text-white px-4 py-2 rounded-xl hover:bg-accent-600 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}