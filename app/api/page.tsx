import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';

export default function ApiDocsPage() {
  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <GlassCard className="p-6 md:p-8">
        <h1 className="text-3xl font-semibold text-surface-50 mb-2">Public API</h1>
        <p className="text-surface-400 mb-6">
          Send URLs to Sift from any tool or script.
        </p>

        <h2 className="text-xl font-semibold text-surface-50 mb-2">Authentication</h2>
        <p className="text-surface-300 mb-4">
          Include your API key in an <code className="text-accent-400">Authorization</code> header:
        </p>
        <pre className="bg-surface-800 p-3 rounded-xl text-xs text-surface-200 mb-6 overflow-x-auto">
          Authorization: Bearer your‑api‑key
        </pre>
        <p className="text-surface-400 text-sm mb-6">
          Find your key in <Link href="/settings" className="text-accent-400 hover:underline">Settings</Link>.
        </p>

        <h2 className="text-xl font-semibold text-surface-50 mb-2">Queue an article</h2>
        <p className="text-surface-300 mb-4">
          <code className="text-accent-400">POST https://thesift.space/api/v1/sift</code>
        </p>
        <pre className="bg-surface-800 p-3 rounded-xl text-xs text-surface-200 mb-6 overflow-x-auto">
{`{
  "url": "https://example.com/article"
}`}
        </pre>

        <h2 className="text-xl font-semibold text-surface-50 mb-2">Sift immediately</h2>
        <p className="text-surface-300 mb-4">
          Add <code className="text-accent-400">?sift=now</code> to the URL to sift the article right away instead of queuing it.
        </p>
        <pre className="bg-surface-800 p-3 rounded-xl text-xs text-surface-200 mb-6 overflow-x-auto">
          POST https://thesift.space/api/v1/sift?sift=now
        </pre>

        <h2 className="text-xl font-semibold text-surface-50 mb-2">Rate limits</h2>
        <p className="text-surface-300">
          The API shares the same fair‑use limits as the app. If you need higher volume, get in touch.
        </p>
      </GlassCard>
    </main>
  );
}