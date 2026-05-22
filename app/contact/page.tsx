// app/contact/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        toast.success('Message sent! We’ll get back to you soon.');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send message.');
      }
    } catch {
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sift
      </Link>

      <GlassCard className="p-6 md:p-8">
        <h1 className="text-3xl font-semibold text-surface-50 mb-2">Contact us</h1>
        <p className="text-surface-400 mb-8">
          Have a question, feedback, or just want to say hi? We’d love to hear from you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-surface-300 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
              disabled={sending}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none"
              disabled={sending}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-surface-300 mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us anything…"
              className="w-full px-3 py-2 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 focus:ring-2 focus:ring-accent-400/50 outline-none resize-y"
              disabled={sending}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 transition"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" /> Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send message
              </>
            )}
          </button>
        </form>
      </GlassCard>
    </main>
  );
}