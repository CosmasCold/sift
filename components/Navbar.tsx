'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { User as UserIcon, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = () => supabase.auth.signOut();

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b border-stone-200/60">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/sift-logo.png"
            alt="Sift"
            width={28}
            height={28}
            className="object-contain"
          />
          <span className="font-serif text-xl font-bold text-stone-800">Sift</span>
        </Link>

        <div className="flex items-center gap-4">
            <Link href="/feeds" className="text-sm text-stone-600 hover:text-accent transition-colors">
  Feeds
</Link>
          <Link href="/library" className="text-sm text-stone-600 hover:text-accent transition-colors">
            Library
          </Link>
          <Link href="/settings" className="text-sm text-stone-600 hover:text-accent transition-colors">
  Settings
</Link>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm text-stone-600">{user.email}</span>
              <button onClick={handleSignOut} className="text-stone-400 hover:text-stone-600">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}