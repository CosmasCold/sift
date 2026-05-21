// app/faq/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'FAQ | Sift',
  description: 'Frequently asked questions about Sift',
};

export default function FAQPage() {
  return (
    <div className="flex flex-col items-center pt-12 pb-16 px-4">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sift
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-card">
          <h1 className="text-3xl font-serif font-bold text-stone-800 mb-6">Frequently Asked Questions</h1>

          <div className="space-y-6 text-stone-700">
            <div>
              <h2 className="text-xl font-semibold text-stone-800">What is Sift?</h2>
              <p className="mt-1">Sift is an AI‑powered reading triage tool. Paste any article URL and get a verdict: “Worth a full read”, “Skim this”, or “You can skip this”. You also get a TL;DR summary and a key insight.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-stone-800">How does the personalisation work?</h2>
              <p className="mt-1">When you click 👍 (agree) or 👎 (disagree) on a verdict, Sift stores that feedback. The AI uses your past feedback to adjust future verdicts. Over time, it learns what you value.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-stone-800">Is my data private?</h2>
              <p className="mt-1">Yes. Your email and sifted articles are stored securely in Supabase. We never sell your data. See our <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link> for details.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-stone-800">Can I use Sift for free?</h2>
              <p className="mt-1">Yes, there will be a free tier with a limited number of sifts per month. Pricing details are coming soon.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-stone-800">What about RSS feeds and email digests?</h2>
              <p className="mt-1">You can add any RSS or Substack feed to automatically sift new posts. Weekly digests (every Monday) recap what you kept that week.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-stone-800">How accurate are the summaries?</h2>
              <p className="mt-1">Sift uses Groq’s LLM (Llama 3.1) to generate summaries and insights. It’s highly accurate, but always use your own judgment for important decisions.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-stone-800">Can I export my kept articles?</h2>
              <p className="mt-1">Yes. On the Library page, click “Export Markdown” to download all your kept articles as a .md file.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}