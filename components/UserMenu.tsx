'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  LogOut,
  Settings,
  Rss,
  Inbox,
  Users,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import UserAvatar from '@/components/UserAvatar';

interface UserMenuProps {
  user: {
    email?: string;
  };
  profile: {
    username: string;
    avatar_url: string | null;
    public_profile: boolean;
  } | null;
}

export default function UserMenu({ user, profile }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-700/50 transition-colors"
      >
        <UserAvatar
          username={profile?.username || user.email?.split('@')[0] || '?'}
          avatarKey={profile?.avatar_url}
          size={28}
        />
        <span className="text-sm text-surface-300 hidden sm:inline">
          {profile?.username || user.email?.split('@')[0] || 'User'}
        </span>
        <ChevronDown className="w-4 h-4 text-surface-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-surface-800 border border-surface-600/60 shadow-glass rounded-2xl p-2 z-[100]"
            style={{ backgroundColor: 'var(--surface-800)', backdropFilter: 'none' }}
          >
            {profile?.username && profile?.public_profile && (
              <Link
                href={`/profile/${profile.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-surface-200 hover:bg-surface-700/50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            )}

            <Link
              href="/queue"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-surface-200 hover:bg-surface-700/50 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              <span>Queue</span>
            </Link>

            <Link
              href="/feeds"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-surface-200 hover:bg-surface-700/50 transition-colors"
            >
              <Rss className="w-4 h-4" />
              <span>Feeds</span>
            </Link>

            <Link
              href="/tags"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-surface-200 hover:bg-surface-700/50 transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Tags</span>
            </Link>

            <Link
              href="/following"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-surface-200 hover:bg-surface-700/50 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Following</span>
            </Link>

            <div className="border-t border-surface-700/50 my-1" />

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-surface-200 hover:bg-surface-700/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <div className="flex items-center justify-between px-3 py-2">
              <ThemeToggle />
              <button
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
                aria-label="Sign out"
                className="flex items-center gap-2 text-sm text-surface-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}