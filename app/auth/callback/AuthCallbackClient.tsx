'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Exchange error:', error);
          toast.error('Sign in failed');
          window.location.href = '/auth';
        } else {
          // Force a full page reload to the home page so the session cookie is sent to the server
          window.location.href = '/';
        }
      });
    } else {
      window.location.href = '/auth';
    }
  }, [searchParams]);

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="animate-spin text-accent-400" size={32} />
    </div>
  );
}