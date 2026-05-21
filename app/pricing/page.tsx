// app/pricing/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Pricing | Sift',
  description: 'Simple, fair pricing for Sift',
};

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center pt-12 pb-16 px-4">
      <div className="w-full max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sift
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-card">
          <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2 text-center">Simple, fair pricing</h1>
          <p className="text-stone-500 text-center mb-8">Start free. Upgrade when you need more.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Tier */}
            <div className="border border-stone-200 rounded-xl p-6 bg-stone-50/50">
              <h2 className="text-xl font-semibold text-stone-800">Free</h2>
              <p className="text-3xl font-bold text-stone-800 mt-2">$0</p>
              <p className="text-stone-500 text-sm mb-4">per month</p>
              <ul className="space-y-2 text-sm text-stone-700">
                <li>✓ 10 sifts per month</li>
                <li>✓ 1 RSS / Substack feed</li>
                <li>✓ Basic AI (Llama 3.1 8B)</li>
                <li>✓ Personalised verdicts</li>
                <li>✓ Library (30‑day history)</li>
                <li className="text-stone-400">✗ Audio TL;DR</li>
                <li className="text-stone-400">✗ Export Markdown</li>
                <li className="text-stone-400">✗ Public reading profile</li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-accent rounded-xl p-6 bg-white shadow-md">
              <div className="inline-block bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full mb-2">Most popular</div>
              <h2 className="text-xl font-semibold text-stone-800">Pro</h2>
              <p className="text-3xl font-bold text-stone-800 mt-2">$6</p>
              <p className="text-stone-500 text-sm mb-4">per month (or $60/year)</p>
              <ul className="space-y-2 text-sm text-stone-700">
                <li>✓ Unlimited sifts</li>
                <li>✓ Unlimited RSS / Substack feeds</li>
                <li>✓ Advanced AI (Llama 3.3 70B)</li>
                <li>✓ Audio TL;DR (listen to summaries)</li>
                <li>✓ Export Markdown</li>
                <li>✓ Public reading profile</li>
                <li>✓ Forever library retention</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>

          <p className="text-center text-stone-500 text-sm mt-8">
            Pricing subject to change. You will be notified before any changes take effect.
          </p>
        </div>
      </div>
    </div>
  );
}