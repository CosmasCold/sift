'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Palette, Target, CloudDownload, Key } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

const AVATARS = [
  { key: 'copper', bg: 'bg-accent-400', text: 'text-white' },
  { key: 'charcoal', bg: 'bg-surface-700', text: 'text-surface-200' },
  { key: 'sage', bg: 'bg-emerald-400', text: 'text-white' },
  { key: 'rose', bg: 'bg-rose-300', text: 'text-white' },
  { key: 'sky', bg: 'bg-sky-400', text: 'text-white' },
  { key: 'amber', bg: 'bg-amber-400', text: 'text-white' },
  { key: 'indigo', bg: 'bg-indigo-400', text: 'text-white' },
  { key: 'coral', bg: 'bg-coral-400', text: 'text-white' },
];

const COVERS = [
  { key: 'charcoal-lavender', style: 'bg-gradient-to-r from-surface-800 via-surface-700 to-accent-800/40' },
  { key: 'lavender-charcoal', style: 'bg-gradient-to-r from-accent-800/40 via-accent-700/30 to-accent-600/20' },
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
  const [weeklyGoal, setWeeklyGoal] = useState(0);
  const [avatarKey, setAvatarKey] = useState('copper');
  const [coverKey, setCoverKey] = useState('charcoal-lavender');
  const [accentKey, setAccentKey] = useState('copper');
  const [loading, setLoading] = useState(true);

  // API key state
  const [apiKey, setApiKey] = useState('');

  // Raindrop.io state
  const [raindropToken, setRaindropToken] = useState('');
  const [raindropSaved, setRaindropSaved] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('username, public_profile, weekly_digest, weekly_goal, avatar_url, cover_url, accent_color, api_key')
          .eq('id', user.id)
          .single();
        if (data) {
          setUsername(data.username || '');
          setPublicProfile(data.public_profile || false);
          setWeeklyDigest(data.weekly_digest || false);
          setWeeklyGoal(data.weekly_goal || 0);
          setAvatarKey(data.avatar_url || 'copper');
          setCoverKey(data.cover_url || 'charcoal-lavender');
          setAccentKey(data.accent_color || 'copper');
          setApiKey(data.api_key || '');
        }

        // Check Raindrop token
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('integration', 'raindrop')
          .single();
        if (integration?.access_token) {
          setRaindropToken(integration.access_token);
          setRaindropSaved(true);
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
        weekly_goal: weeklyGoal,
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
      document.documentElement.setAttribute('data-accent', accentKey);
      localStorage.setItem('accent', accentKey);
    }
  };

  const regenerateApiKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newKey = crypto.randomUUID();
    const { error } = await supabase
      .from('user_profiles')
      .update({ api_key: newKey })
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to regenerate API key');
    } else {
      setApiKey(newKey);
      toast.success('New API key generated');
    }
  };

  const copyApiKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    toast.success('API key copied');
  };

  const handleSaveRaindropToken = async () => {
    if (!raindropToken.trim()) {
      toast.error('Please enter your Raindrop API token');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('user_integrations').upsert({
      user_id: user.id,
      integration: 'raindrop',
      access_token: raindropToken.trim(),
    });

    if (error) {
      toast.error('Failed to save token');
    } else {
      setRaindropSaved(true);
      toast.success('Raindrop token saved');
    }
  };

  const handleImportRaindrop = async () => {
    setImporting(true);
    const res = await fetch('/api/integrations/raindrop/import');
    const data = await res.json();
    if (data.imported) {
      toast.success(`${data.imported} articles imported to Queue`);
    } else {
      toast.error(data.error || 'Import failed');
    }
    setImporting(false);
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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${AVATARS.find(a => a.key === avatarKey)?.bg} ${AVATARS.find(a => a.key === avatarKey)?.text}`}>
              {username ? username[0].toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button key={a.key} onClick={() => setAvatarKey(a.key)} className={`w-8 h-8 rounded-full ${a.bg} ${avatarKey === a.key ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-800' : ''}`} aria-label={`Avatar ${a.key}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Cover picker */}
        <div>
          <label className="text-sm font-medium text-surface-300">Cover image</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {COVERS.map(c => (
              <button key={c.key} onClick={() => setCoverKey(c.key)} className={`h-16 rounded-xl ${c.style} ${coverKey === c.key ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-surface-800' : ''}`} aria-label={`Cover ${c.key}`} />
            ))}
          </div>
        </div>

        {/* Accent picker */}
        <div>
          <label className="text-sm font-medium text-surface-300 flex items-center gap-2"><Palette className="w-4 h-4" /> Accent colour</label>
          <div className="flex items-center gap-3 mt-2">
            {ACCENTS.map(a => (
              <button key={a.key} onClick={() => setAccentKey(a.key)} className={`w-10 h-10 rounded-full border-2 ${accentKey === a.key ? 'border-white ring-2 ring-surface-400' : 'border-transparent'}`} style={{ backgroundColor: a.color }} aria-label={a.label} />
            ))}
            <span className="text-sm text-surface-400 ml-2">{ACCENTS.find(a => a.key === accentKey)?.label}</span>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-medium text-surface-300">Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1 px-3 py-2 border border-surface-700 rounded-xl bg-surface-800/50 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400/50" placeholder="yourname" />
        </div>

        {/* Public profile toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-300">Public profile</p>
            <p className="text-xs text-surface-400">Allow others to see what you&apos;re keeping.</p>
          </div>
          <button onClick={() => setPublicProfile(!publicProfile)} className={`relative w-11 h-6 rounded-full transition-colors ${publicProfile ? 'bg-accent-500' : 'bg-surface-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${publicProfile ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {/* Weekly digest toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-300 flex items-center gap-2"><Mail className="w-4 h-4 text-accent-400" /> Weekly digest</p>
            <p className="text-xs text-surface-400">Receive a Monday email with your top kept articles.</p>
          </div>
          <button onClick={() => setWeeklyDigest(!weeklyDigest)} className={`relative w-11 h-6 rounded-full transition-colors ${weeklyDigest ? 'bg-accent-500' : 'bg-surface-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${weeklyDigest ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {/* Weekly goal */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-400" /> Weekly reading goal
            </p>
            <p className="text-xs text-surface-400">Number of articles to keep per week.</p>
          </div>
          <input
            type="number"
            min={0}
            max={20}
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(Number(e.target.value))}
            className="w-16 px-2 py-1 text-center text-sm bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 focus:ring-2 focus:ring-accent-400/50 outline-none"
            placeholder="0"
          />
        </div>

        {/* Public API key management */}
        <div className="border-t border-surface-700/50 pt-4 mt-2">
          <h3 className="font-medium text-surface-200 mb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-accent-400" /> Public API
          </h3>
          <p className="text-xs text-surface-400 mb-3">
            Use this key to send URLs to Sift from automation tools.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={apiKey || 'Generating…'}
              className="flex-1 px-3 py-2 text-sm bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:outline-none"
            />
            <button
              onClick={copyApiKey}
              className="px-4 py-2 bg-surface-800/60 border border-surface-700/50 text-surface-300 rounded-xl text-sm font-medium hover:bg-surface-700/60 transition"
            >
              Copy
            </button>
            <button
              onClick={regenerateApiKey}
              className="px-4 py-2 bg-surface-800/60 border border-surface-700/50 text-surface-300 rounded-xl text-sm font-medium hover:bg-surface-700/60 transition"
            >
              Regenerate
            </button>
          </div>
          <p className="text-xs text-surface-500 mt-2">
            POST to <code className="text-accent-400">https://thesift.space/api/v1/sift</code> with<br />
            <code className="text-surface-300">Authorization: Bearer your‑key</code> and JSON body{' '}
            <code className="text-surface-300">{`{ "url": "https://..." }`}</code>
            <br />Add <code className="text-accent-400">?sift=now</code> to sift immediately instead of queuing.
          </p>
        </div>

        {/* Raindrop.io integration */}
        <div className="border-t border-surface-700/50 pt-4 mt-2">
          <h3 className="font-medium text-surface-200 mb-2 flex items-center gap-2">
            <CloudDownload className="w-4 h-4 text-accent-400" /> Raindrop.io import
          </h3>
          <p className="text-xs text-surface-400 mb-3">
            Import your saved bookmarks from Raindrop.io into your Sift Queue.
            <br />
            <a href="https://app.raindrop.io/settings/integrations" target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:underline">
              Create an API token
            </a>{' '}
            in your Raindrop settings, paste it below, then click Import.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={raindropToken}
              onChange={(e) => setRaindropToken(e.target.value)}
              placeholder="Raindrop API token"
              className="flex-1 px-3 py-2 text-sm bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400/50"
            />
            <button
              onClick={handleSaveRaindropToken}
              className="px-4 py-2 bg-surface-800/60 border border-surface-700/50 text-surface-300 rounded-xl text-sm font-medium hover:bg-surface-700/60 transition"
            >
              Save
            </button>
          </div>
          {raindropSaved && (
            <button
              onClick={handleImportRaindrop}
              disabled={importing}
              className="mt-3 w-full px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-medium hover:bg-accent-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <CloudDownload className="w-4 h-4" />
              {importing ? 'Importing…' : 'Import from Raindrop'}
            </button>
          )}
        </div>

        <button onClick={handleSave} className="w-full py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors">
          Save Settings
        </button>
      </GlassCard>
    </main>
  );
}