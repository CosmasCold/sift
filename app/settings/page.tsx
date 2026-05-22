'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, User, Mail } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [publicProfile, setPublicProfile] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('username, public_profile, weekly_digest, avatar_url, cover_url')
          .eq('id', user.id)
          .single();
        if (data) {
          setUsername(data.username || '');
          setPublicProfile(data.public_profile || false);
          setWeeklyDigest(data.weekly_digest || false);
          setAvatarUrl(data.avatar_url);
          setCoverUrl(data.cover_url);
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
      })
      .eq('id', user.id);

    if (error) {
      if (error.code === '23505') toast.error('Username already taken');
      else toast.error('Failed to save');
    } else {
      toast.success('Settings saved');
    }
  };

  const uploadFile = async (file: File, type: 'avatar' | 'cover') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const fileExt = file.name.split('.').pop();
    const filePath = type === 'avatar'
      ? `${user.id}/avatar-${Date.now()}.${fileExt}`
      : `${user.id}/cover-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large (max 2MB)');
      return;
    }

    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadFile(file, 'avatar');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      toast.success('Avatar updated');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    setUploadingCover(true);
    try {
      const publicUrl = await uploadFile(file, 'cover');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ cover_url: publicUrl })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
      if (updateError) throw updateError;
      setCoverUrl(publicUrl);
      toast.success('Cover image updated');
    } catch (err) {
      console.error('Cover upload error:', err);
      toast.error('Failed to upload cover');
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return <div className="flex-1 pt-16 text-center text-surface-400">Loading…</div>;
  }

  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app';

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-lg mx-auto">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="text-2xl font-semibold text-surface-50 mb-6">Settings</h1>

      <GlassCard className="p-6 space-y-6">
        {/* Avatar upload */}
        <div>
          <label className="text-sm font-medium text-surface-300">Profile picture</label>
          <div className="flex items-center gap-4 mt-1">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="avatar"
                width={64}
                height={64}
                unoptimized
                className="w-16 h-16 rounded-full object-cover border border-surface-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-surface-800/60 flex items-center justify-center text-surface-400">
                <User className="w-8 h-8" />
              </div>
            )}
            <label className="cursor-pointer bg-surface-800/60 hover:bg-surface-700/60 px-3 py-2 rounded-xl text-sm flex items-center gap-2 text-surface-200 transition-colors">
              <Upload className="w-4 h-4" />
              {uploadingAvatar ? 'Uploading...' : 'Upload'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
            </label>
          </div>
        </div>

        {/* Cover image upload */}
        <div>
          <label className="text-sm font-medium text-surface-300">Cover image</label>
          <div className="mt-1">
            {coverUrl ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-surface-700">
                <Image src={coverUrl} alt="Cover" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-full h-32 rounded-xl bg-gradient-to-r from-surface-800 to-surface-800/50 flex items-center justify-center text-surface-400 text-sm">
                No cover image
              </div>
            )}
            <label className="cursor-pointer bg-surface-800/60 hover:bg-surface-700/60 px-3 py-2 rounded-xl text-sm flex items-center gap-2 mt-2 w-fit text-surface-200 transition-colors">
              <Upload className="w-4 h-4" />
              {uploadingCover ? 'Uploading...' : 'Upload cover'}
              <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} className="hidden" />
            </label>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-medium text-surface-300">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

        {/* Weekly digest toggle – NEW */}
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

        {/* Embed widget section */}
        {publicProfile && username && (
          <div className="border-t border-surface-700/50 pt-4 mt-2">
            <h3 className="font-medium text-surface-200 mb-2">📦 Embed your reading list</h3>
            <p className="text-xs text-surface-400 mb-2">Copy this code into your website, blog, or Notion:</p>
            <pre className="bg-surface-800/50 p-3 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap break-all text-surface-200 border border-surface-700/50">
              {`<script src="${siteUrl}/embed/${username}"></script>`}
            </pre>
          </div>
        )}

        <button onClick={handleSave} className="w-full py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors">
          Save Settings
        </button>
      </GlassCard>
    </main>
  );
}