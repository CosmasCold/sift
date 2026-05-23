'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast.error('Sign in failed');
          router.push('/auth');
        } else {
          router.push('/');
        }
      });
    } else {
      router.push('/auth');
    }
  }, [searchParams, router]);

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="animate-spin text-accent-400" size={32} />
    </div>
  );
}