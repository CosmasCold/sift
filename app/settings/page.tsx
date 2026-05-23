'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Palette } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

const AVATARS = [
  { key: 'lavender', bg: 'bg-accent-400', text: 'text-white' },
  { key: 'charcoal', bg: 'bg-surface-700', text: 'text-surface-200' },
  { key: 'sage', bg: 'bg-emerald-400', text: 'text-white' },
  { key: 'rose', bg: 'bg-rose-300', text: 'text-white' },
  { key: 'sky', bg: 'bg-sky-400', text: 'text-white' },
  { key: 'amber', bg: 'bg-amber-400', text: 'text-white' },
  { key: 'indigo', bg: 'bg-indigo-400', text: 'text-white' },
  { key: 'coral', bg: 'bg-coral-400', text: 'text-white' },
];

const COVERS = [
  { key: 'lavender-charcoal', style: 'bg-gradient-to-r from-accent-800/40 via-accent-700/30 to-accent-600/20' },
  { key: 'charcoal-lavender', style: 'bg-gradient-to-r from-surface-800 via-surface-700 to-accent-800/40' },
  { key: 'sage-charcoal', style: 'bg-gradient-to-r from-emerald-800/30 via-surface-800 to-surface-700' },
  { key: 'rose-gold', style: 'bg-gradient-to-r from-rose-800/30 via-amber-700/20 to-surface-800' },
  { key: 'sky-charcoal', style: 'bg-gradient-to-r from-sky-800/30 via-surface-800 to-accent-800/40' },
  { key: 'midnight', style: 'bg-gradient-to-r from-surface-950 via-surface-900 to-surface-800' },
];

const ACCENTS = [
  { key: 'copper', label: 'Copper', color: '#c77d5a' },
  { key: 'teal', label: 'Quiet Teal', color: '#7fb3b3' },
  { key: 'slate', label: 'Warm Slate', color: '#9b9b9b' },
];

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [publicProfile, setPublicProfile] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [avatarKey, setAvatarKey] = useState('lavender');
  const [coverKey, setCoverKey] = useState('charcoal-lavender');
  const [accentKey, setAccentKey] = useState('copper');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('username, public_profile, weekly_digest, avatar_url, cover_url, accent_color')
          .eq('id', user.id)
          .single();
        if (data) {
          setUsername(data.username || '');
          setPublicProfile(data.public_profile || false);
          setWeeklyDigest(data.weekly_digest || false);
          setAvatarKey(data.avatar_url || 'lavender');
          setCoverKey(data.cover_url || 'charcoal-lavender');
          setAccentKey(data.accent_color || 'copper');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({
        username: username.trim(),
        public_profile: publicProfile,
        weekly_digest: weeklyDigest,
        avatar_url: avatarKey,
        cover_url: coverKey,
        accent_color: accentKey,
      })
      .eq('id', user.id);

    if (error) {
      if (error.code === '23505') toast.error('Username already taken');
      else toast.error('Failed to save');
    } else {
      toast.success('Settings saved');
      // Apply accent immediately
      document.documentElement.setAttribute('data-accent', accentKey);
      localStorage.setItem('accent', accentKey);
    }
  };

  if (loading) {
    return <div className="flex-1 pt-16 text-center text-surface-400">Loading…</div>;
  }

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-lg mx-auto">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="text-2xl font-semibold text-surface-50 mb-6">Settings</h1>

      <GlassCard className="p-6 space-y-6">
        {/* Avatar picker */}
        <div>
          <label className="text-sm font-medium text-surface-300">Profile picture</label>
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                AVATARS.find(a => a.key === avatarKey)?.bg
              } ${AVATARS.find(a => a.key === avatarKey)?.text}`}
            >
              {username ? username[0].toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button
                  key={a.key}
                  onClick={() => setAvatarKey(a.key)}
                  className={`w-8 h-8 rounded-full ${a.bg} ${
                    avatarKey === a.key ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-800' : ''
                  }`}
                  aria-label={`Avatar ${a.key}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Cover picker */}
        <div>
          <label className="text-sm font-medium text-surface-300">Cover image</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {COVERS.map(c => (
              <button
                key={c.key}
                onClick={() => setCoverKey(c.key)}
                className={`h-16 rounded-xl ${c.style} ${
                  coverKey === c.key ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-surface-800' : ''
                }`}
                aria-label={`Cover ${c.key}`}
              />
            ))}
          </div>
        </div>

        {/* Accent picker */}
        <div>
          <label className="text-sm font-medium text-surface-300 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Accent colour
          </label>
          <div className="flex items-center gap-3 mt-2">
            {ACCENTS.map(a => (
              <button
                key={a.key}
                onClick={() => setAccentKey(a.key)}
                className={`w-10 h-10 rounded-full border-2 ${
                  accentKey === a.key ? 'border-white ring-2 ring-surface-400' : 'border-transparent'
                }`}
                style={{ backgroundColor: a.color }}
                aria-label={a.label}
              />
            ))}
            <span className="text-sm text-surface-400 ml-2">
              {ACCENTS.find(a => a.key === accentKey)?.label}
            </span>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-medium text-surface-300">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-surface-700 rounded-xl bg-surface-800/50 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400/50"
            placeholder="yourname"
          />
        </div>

        {/* Public profile toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-300">Public profile</p>
            <p className="text-xs text-surface-400">Allow others to see what you&apos;re keeping.</p>
          </div>
          <button
            onClick={() => setPublicProfile(!publicProfile)}
            className={`relative w-11 h-6 rounded-full transition-colors ${publicProfile ? 'bg-accent-500' : 'bg-surface-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${publicProfile ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {/* Weekly digest toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent-400" /> Weekly digest
            </p>
            <p className="text-xs text-surface-400">Receive a Monday email with your top kept articles.</p>
          </div>
          <button
            onClick={() => setWeeklyDigest(!weeklyDigest)}
            className={`relative w-11 h-6 rounded-full transition-colors ${weeklyDigest ? 'bg-accent-500' : 'bg-surface-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${weeklyDigest ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <button onClick={handleSave} className="w-full py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors">
          Save Settings
        </button>
      </GlassCard>
    </main>
  );
}