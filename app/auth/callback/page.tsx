import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}