import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-lg mx-auto text-center">
      <GlassCard className="p-10">
        <h1 className="text-3xl font-semibold text-surface-50 mb-2">Nothing here</h1>
        <p className="text-surface-400 text-sm mb-6">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-medium hover:bg-accent-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go home
        </Link>
      </GlassCard>
    </main>
  );
}