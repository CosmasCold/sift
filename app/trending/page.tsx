import { Suspense } from 'react';
import TrendingClient from './TrendingClient';

export default function TrendingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center pt-16">
          <div className="animate-spin w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <TrendingClient />
    </Suspense>
  );
}