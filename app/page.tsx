// app/page.tsx
import { Suspense } from 'react';
import HomeClient from './HomeClient';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}