'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function FollowButton({ followingId }: { followingId: string }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .single();
      setFollowing(!!data);
      setLoading(false);
    };
    check();
  }, [followingId]);

  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followingId }),
    });
    const data = await res.json();
    if (res.ok) {
      setFollowing(data.following);
      toast.success(data.following ? 'Following' : 'Unfollowed');
    } else {
      toast.error('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1.5 text-sm rounded-full font-medium transition ${
        following
          ? 'bg-surface-700 text-surface-200 hover:bg-surface-600'
          : 'bg-accent-500 text-white hover:bg-accent-600'
      } disabled:opacity-50`}
    >
      {loading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  );
}