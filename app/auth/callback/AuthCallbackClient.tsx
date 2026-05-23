'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    const handleCallback = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Exchange error:', error);
          // Even if exchange fails, check if we have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Already logged in (perhaps from a previous session), go home
            router.push('/');
            return;
          }
          toast.error('Sign in failed');
          router.push('/auth');
          return;
        }
        // Success – go home
        router.push('/');
      } else {
        router.push('/auth');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="animate-spin text-accent-400" size={32} />
    </div>
  );
}