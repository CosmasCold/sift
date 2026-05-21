// app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [publicProfile, setPublicProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('username, public_profile')
          .eq('id', user.id)
          .single();
        if (data) {
          setUsername(data.username || '');
          setPublicProfile(data.public_profile || false);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({
        username: username.trim(),
        public_profile: publicProfile,
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('Username already taken');
      } else {
        toast.error('Failed to save');
      }
    } else {
      toast.success('Settings saved');
    }
  };

  if (loading) {
    return (
      <main className="flex-1 pt-16 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto" />
      </main>
    );
  }

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-lg mx-auto">
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="text-2xl font-serif font-bold text-stone-800 mb-6">Settings</h1>

      <div className="space-y-6 bg-white rounded-2xl p-6 border border-stone-200 shadow-card">
        {/* Username */}
        <div>
          <label className="text-sm font-medium text-stone-700">Username</label>
          <p className="text-xs text-stone-400 mb-1">
            This will be your public profile URL: sift.pauseapp.space/profile/yourname
          </p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-accent"
          />
        </div>

        {/* Public profile toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-700">Public profile</p>
            <p className="text-xs text-stone-400">
              Allow others to see what you&apos;re keeping.
            </p>
          </div>
          <button
            onClick={() => setPublicProfile(!publicProfile)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              publicProfile ? 'bg-accent' : 'bg-stone-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                publicProfile ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </main>
  );
}