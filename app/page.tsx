'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Sparkles, ClipboardList, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface SiftResult {
  summary: string;
  insight: string;
  verdict: 'Worth a full read' | 'Skim this' | 'You can skip this';
  sourceUrl?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [result, setResult] = useState<SiftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user ?? null);
    setLoadingAuth(false);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => setUser(session?.user ?? null)
  );
  return () => subscription.unsubscribe();
}, []);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-3xl font-serif font-bold text-stone-800 mb-3">
            Save articles. Sift them. Keep what matters.
          </h1>
          <p className="text-stone-600 mb-8">
            Sign in to start building your personal library of sifted articles.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Sift
          </Link>
        </motion.div>
      </main>
    );
  }

  const handleListen = async () => {
    if (!result) return;
    try {
      const res = await fetch('/api/listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: result.summary }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onplay = () => setAudioPlaying(true);
        audio.onended = () => setAudioPlaying(false);
        audio.play();
      } else {
        toast.error('Could not generate audio');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleSift = async (e: React.FormEvent) => {
    e.preventDefault();

    // Batch mode
    if (batchMode) {
      const lines = batchUrls.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;

      setLoading(true);
      const resultsArr: SiftResult[] = [];

      for (const u of lines) {
        try {
          const res = await fetch('/api/sift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: u }),
          });
          const data = await res.json();
          if (!data.error) {
            resultsArr.push(data);
            fetch('/api/save-sift', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: u,
                sourceUrl: data.sourceUrl,
                summary: data.summary,
                insight: data.insight,
                verdict: data.verdict,
              }),
            }).catch(() => {});
          }
        } catch {}
      }

      setLoading(false);

      if (resultsArr.length > 0) {
        setResult(resultsArr[0]);
        toast.success(`Sifted ${resultsArr.length} article${resultsArr.length > 1 ? 's' : ''}`);
      }
      if (resultsArr.length > 1) {
  toast(`The other ${resultsArr.length - 1} article(s) are in your Library.`);
}
      else {
        toast.error('Could not sift any of the URLs');
      }

      setBatchUrls('');
      return;
    }

    // Single mode
    const textToSend = showManualFallback ? manualText.trim() : '';
    if (!showManualFallback && !url.trim()) return;
    if (showManualFallback && !textToSend) {
      toast.error('Please paste the article text.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/sift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, manualText: textToSend }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        if (data.needsManualFallback) {
          setShowManualFallback(true);
        }
      } else {
        setResult(data);
        setShowManualFallback(false);
        setManualText('');

        fetch('/api/save-sift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            sourceUrl: data.sourceUrl,
            summary: data.summary,
            insight: data.insight,
            verdict: data.verdict,
          }),
        }).catch(() => {});
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const verdictDot = {
    'Worth a full read': 'bg-verdict-green',
    'Skim this': 'bg-verdict-amber',
    'You can skip this': 'bg-verdict-grey',
  };

  return (
    <div className="flex flex-col items-center gap-8 pt-12 md:pt-16">
      <motion.form
        onSubmit={handleSift}
        className="w-full max-w-2xl md:max-w-3xl flex flex-col gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!showManualFallback && (
          <>
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setBatchMode(!batchMode)}
                className={`text-sm font-medium transition-colors ${
                  batchMode ? 'text-accent' : 'text-stone-600 hover:text-accent'
                }`}
              >
                {batchMode ? 'Single URL' : 'Batch URLs'}
              </button>
            </div>

            {batchMode ? (
              <textarea
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                placeholder="Paste URLs, one per line…"
                className="w-full h-32 p-3 bg-white rounded-2xl shadow-card border border-stone-200 focus:outline-none focus:border-accent resize-y text-stone-700"
                disabled={loading}
              />
            ) : (
              <div className="flex items-center gap-3 p-2 pl-6 bg-white rounded-2xl shadow-card border border-stone-200 focus-within:border-accent transition-colors">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a link to sift it"
                  className="flex-1 bg-transparent outline-none text-stone-700 placeholder-stone-400"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowManualFallback(true)}
                  className="text-stone-400 hover:text-accent transition-colors"
                  title="Paste text manually"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Submit button - always visible */}
            <button
              type="submit"
              disabled={loading}
className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors sm:w-auto mt-2"            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sifting…
                </>
              ) : (
                <>
                  Sift
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        )}

        {showManualFallback && (
          <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-card border border-stone-200">
            <p className="text-sm text-stone-500">
              This article couldn&apos;t be fetched automatically. Paste the full text below.
            </p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the article text here…"
              className="w-full h-40 p-3 border border-stone-200 rounded-xl resize-y focus:outline-none focus:border-accent text-stone-700"
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualFallback(false)}
                className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !manualText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sifting…
                  </>
                ) : (
                  <>
                    Sift Text
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.form>

      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl border border-stone-200/60 shadow-lg px-6 py-3"
        >
          <p className="text-stone-600 text-sm font-medium">
            Paste a link to start sifting.
          </p>
        </motion.div>
      )}

      {loading && (
        <div className="w-full max-w-2xl bg-warm-card rounded-card shadow-card p-6 border border-stone-100 animate-pulse">
          <div className="h-3 w-3 rounded-full bg-stone-200 mb-4" />
          <div className="h-4 w-32 bg-stone-200 rounded mb-3" />
          <div className="h-4 w-full bg-stone-200 rounded mb-2" />
          <div className="h-4 w-3/4 bg-stone-200 rounded mb-6" />
          <div className="h-4 w-24 bg-stone-200 rounded" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.sourceUrl}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-2xl bg-warm-card rounded-card border border-stone-200/80 p-6
                       shadow-[0_2px_12px_rgba(91,75,138,0.06)] hover:shadow-[0_4px_20px_rgba(91,75,138,0.10)]
                       transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-100">
              <span className={`w-3.5 h-3.5 rounded-full ${verdictDot[result.verdict]} ring-2 ring-offset-2 ${verdictDot[result.verdict].replace('bg-', 'ring-')}`} />
              <span className="text-sm font-semibold text-stone-700">{result.verdict}</span>
              <Sparkles className="w-4 h-4 text-accent ml-auto" />
            </div>
            <div className="mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">TL;DR</h3>
              <p className="text-stone-800 leading-relaxed">{result.summary}</p>
            </div>
            {result.insight && (
              <div className="bg-warm-hover/60 rounded-xl p-4 border-l-4 border-accent mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Key Insight</h3>
                <p className="text-stone-800 italic leading-relaxed">{result.insight}</p>
              </div>
            )}
            <div className="flex items-center gap-4 mt-4">
              <a
                href={result.sourceUrl || url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm font-medium"
              >
                Read full article
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleListen}
                disabled={audioPlaying}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  audioPlaying ? 'text-stone-400 cursor-not-allowed' : 'text-accent hover:underline'
                }`}
              >
                {audioPlaying ? '🔊 Playing…' : '🎧 Listen'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}