// app/privacy/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PrivacyPage() {
  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sift
      </Link>

      <GlassCard className="p-6 md:p-8">
        <h1 className="text-3xl font-semibold text-surface-50 mb-4">Privacy Policy</h1>
        <p className="text-surface-400 text-sm mb-6">Last updated: May 19, 2026</p>

        <div className="space-y-4 text-surface-200">
          <p>At Sift, we take your privacy seriously. This policy describes what data we collect and how we use it.</p>

          <h2 className="text-xl font-semibold text-surface-50 mt-6">1. Information we collect</h2>
          <p>We collect your email address when you sign in (via Supabase authentication). We also store the articles you sift, your feedback (agree/disagree), and your reading preferences to personalise future verdicts.</p>

          <h2 className="text-xl font-semibold text-surface-50 mt-6">2. How we use your data</h2>
          <p>Your data is used solely to provide and improve the Sift service: generating article summaries, personalising verdicts based on your feedback, and sending weekly digests (if you keep articles). We never sell your data to third parties.</p>

          <h2 className="text-xl font-semibold text-surface-50 mt-6">3. Third-party services</h2>
          <p>We use Groq (for AI summarisation), Supabase (database and authentication), Resend (emails), and ElevenLabs (audio). Each service has its own privacy policy. We only share the minimum required data (e.g., article text to Groq, email address to Resend).</p>

          <h2 className="text-xl font-semibold text-surface-50 mt-6">4. Your rights</h2>
          <p>You can delete any article from your library at any time. You can also request account deletion by contacting us via the <Link href="/contact" className="text-accent-400 hover:underline">contact page</Link>.</p>

          <h2 className="text-xl font-semibold text-surface-50 mt-6">5. Changes to this policy</h2>
          <p>We may update this policy occasionally. The latest version will always be posted here.</p>

          <p className="mt-8 text-sm text-surface-400">If you have any questions, please reach out via the contact page.</p>
        </div>
      </GlassCard>
    </main>
  );
}