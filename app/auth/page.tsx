'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: 'https://sift-lac.vercel.app',
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the magic link');
    }
    setMagicLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://sift-lac.vercel.app',
      },
    });

    if (error) {
      toast.error(error.message);
    }
    setGoogleLoading(false);
  };

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-md mx-auto">
      <GlassCard className="p-8">
        <h1 className="text-2xl font-semibold text-surface-50 text-center mb-6">
          Sign in to Sift
        </h1>

        {/* Google sign‑in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-2.5 bg-white text-gray-800 rounded-xl font-medium hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2 mb-4 transition"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-700/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-800 px-2 text-surface-400">or</span>
          </div>
        </div>

        {/* Magic link */}
        <form onSubmit={handleMagicLink} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
          />
          <button
            type="submit"
            disabled={magicLoading || !email.trim()}
            className="w-full py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {magicLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Send magic link
          </button>
        </form>
      </GlassCard>
    </main>
  );
}