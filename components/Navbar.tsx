'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, LogOut, Settings, Library, Rss } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('username, avatar_url')
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
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="relative z-20 border-b border-stone-200/30 bg-white/40 backdrop-blur-md px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <Link href="/" className="text-xl font-serif font-bold text-stone-800">
          Sift
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link href="/library" className="text-stone-600 hover:text-accent transition-colors flex items-center gap-1">
              <Library className="w-4 h-4" /> Library
            </Link>
            <Link href="/feeds" className="text-stone-600 hover:text-accent transition-colors flex items-center gap-1">
              <Rss className="w-4 h-4" /> Feeds
            </Link>
            <Link href="/settings" className="text-stone-600 hover:text-accent transition-colors flex items-center gap-1">
              <Settings className="w-4 h-4" /> Settings
            </Link>

            <div className="flex items-center gap-2 ml-2">
              {profile?.avatar_url ? (
  <Image
    src={profile.avatar_url}
    alt="avatar"
    width={24}
    height={24}
    className="rounded-full object-cover"
  />
) : (
  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
    <User className="w-4 h-4 text-accent" />
  </div>
)}
              <span className="text-sm text-stone-700">
                {profile?.username || user.email?.split('@')[0] || 'User'}
              </span>
              <button
                onClick={handleSignOut}
                className="text-stone-500 hover:text-red-500 transition-colors ml-2"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <Link href="/auth" className="text-sm bg-accent text-white px-4 py-2 rounded-xl">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}