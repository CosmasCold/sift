import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const faqs = [
  {
    question: 'What is Sift?',
    answer: `Sift is an AI‑powered reading triage tool. You paste an article URL (or add RSS feeds), and Sift reads it, gives you a short summary, and tells you whether it's "Worth a full read", "Skim this", or "You can skip this". It helps you decide what matters without reading everything first.`,
  },
  {
    question: 'How does the AI verdict work?',
    answer: `Sift sends the article text to a language model (via Groq) that analyses the content and returns a verdict, a one‑paragraph summary, and often a key insight. If you give feedback (thumbs up or down) on a verdict, Sift uses that history to personalise future verdicts.`,
  },
  {
    question: 'Is my data private?',
    answer: `Yes. Your email and sifted articles are stored securely in Supabase. We never sell your data. Your public profile is completely optional—you control what others see. See our <a href="/privacy" style="color:#c77d5a;text-decoration:underline;">Privacy Policy</a> for details.`,
  },
  {
    question: 'Can I use Sift for free?',
    answer: `Sift is free to use. I plan to keep it that way while I work out a sustainable path forward — probably a support option or a tasteful sponsorship down the road. For now, if you'd like to help, there's a Support Sift link in the footer. Whatever happens, your library is yours. You can export it anytime as Markdown or OPML, and I'll never hold your data hostage.`,
  },
  {
    question: 'What are RSS feeds and how do they work in Sift?',
    answer: `RSS (Really Simple Syndication) is a way to get updates from websites, blogs, and newsletters automatically. Add any RSS or Substack URL on the <a href="/feeds" style="color:#c77d5a;text-decoration:underline;">Feeds page</a>, and Sift will automatically sift new posts and add them to your library.`,
  },
  {
    question: 'Can I import my existing bookmarks?',
    answer: `Yes. You can import your saved articles from Raindrop.io right from the <a href="/settings" style="color:#c77d5a;text-decoration:underline;">Settings page</a>. We also support importing OPML files for your feed subscriptions.`,
  },
  {
    question: 'What are Collections and how do I create one?',
    answer: `Collections are themed reading lists you can curate from your kept articles. Anyone can create a collection from the <a href="/collections/new" style="color:#c77d5a;text-decoration:underline;">Collections page</a>. You can also star collections created by other readers.`,
  },
  {
    question: 'How does the social side work?',
    answer: `Sift has a quiet social layer: you can follow other readers, see what they're keeping, and browse trending articles in the community. There are no comments, no likes—just a signal that something mattered to someone. You control your public profile in <a href="/settings" style="color:#c77d5a;text-decoration:underline;">Settings</a>.`,
  },
  {
    question: 'Can I export my library?',
    answer: `Yes. You can export your kept articles as a Markdown file from the Library page. You can also export your RSS feeds as an OPML file from the Feeds page. Your data always belongs to you.`,
  },
  {
    question: 'Does Sift have an API?',
    answer: `Yes. Every user gets a personal API key in <a href="/settings" style="color:#c77d5a;text-decoration:underline;">Settings</a>. You can use it to send URLs to Sift from automation tools like Zapier, iOS Shortcuts, or custom scripts.`,
  },
  {
    question: 'What about the weekly digest?',
    answer: `If you opt in from Settings, Sift will send you a beautiful email every Monday morning with your top kept articles of the week. It's like a personal newsletter generated from your own reading.`,
  },
  {
    question: 'What technology does Sift use?',
    answer: `Sift is built with Next.js, Tailwind CSS, and Supabase. AI verdicts are powered by Groq. Email delivery is handled by Brevo. The site is hosted on Vercel. All of these tools have free tiers, which helps keep Sift free for everyone.`,
  },
  {
    question: 'How do I get started?',
    answer: `Sign up, go to the <a href="/discover" style="color:#c77d5a;text-decoration:underline;">Discover page</a> to find feeds you like, paste an article URL on the home page, and sift your first article. It takes about 30 seconds.`,
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer.replace(/<[^>]*>/g, ''),
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sift
        </Link>

        <GlassCard className="p-6 md:p-8">
          <h1 className="text-3xl font-semibold text-surface-50 mb-6">
            Frequently Asked Questions
          </h1>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i}>
                <h2 className="text-xl font-semibold text-surface-50 mb-2">
                  {faq.question}
                </h2>
                <p
                  className="text-surface-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </>
  );
}