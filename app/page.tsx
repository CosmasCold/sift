'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  Sparkles,
  ClipboardList,
  Search,
  ImageOff,
  Copy,
  Rss,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { GlassCard } from '@/components/ui/GlassCard';

interface SiftResult {
  summary: string;
  insight: string;
  verdict: 'Worth a full read' | 'Skim this' | 'You can skip this';
  sourceUrl?: string;
  readingTime?: number;
  thumbnailUrl?: string | null;
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

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [articleCount, setArticleCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    }).finally(() => {
      if (mounted) setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Check how many articles the user has sifted (for onboarding)
  useEffect(() => {
    if (!user) return;
    const checkArticles = async () => {
      const { count, error } = await supabase
        .from('sifted_articles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!error && count !== null) {
        setArticleCount(count);
        if (count === 0) setShowOnboarding(true);
      }
    };
    checkArticles();
  }, [user]);

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
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onplay = () => setAudioPlaying(true);
        audio.onended = () => setAudioPlaying(false);
        audio.play();
      } else toast.error('Could not generate audio');
    } catch { toast.error('Something went wrong'); }
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
    url,
    sourceUrl: data.sourceUrl,
    summary: data.summary,
    insight: data.insight,
    verdict: data.verdict,
    readingTime: data.readingTime,
    thumbnailUrl: data.thumbnailUrl,
    fullText: data.fullText,
  }),
}).catch(() => {});
          }
        } catch {}
      }
      setLoading(false);
      if (resultsArr.length > 0) {
        setResult(resultsArr[0]);
        toast.success(`Sifted ${resultsArr.length} article${resultsArr.length > 1 ? 's' : ''}`);
        if (resultsArr.length > 1) toast(`The other ${resultsArr.length - 1} article(s) are in your Library.`);
        // Hide onboarding on first sift
        setShowOnboarding(false);
        setArticleCount(prev => (prev === 0 ? 1 : prev));
      } else toast.error('Could not sift any of the URLs');
      setBatchUrls('');
      return;
    }

    // Single mode
    const textToSend = showManualFallback ? manualText.trim() : '';
    if (!showManualFallback && !url.trim()) return;
    if (showManualFallback && !textToSend) { toast.error('Please paste the article text.'); return; }
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
        if (data.needsManualFallback) setShowManualFallback(true);
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
            readingTime: data.readingTime,
            thumbnailUrl: data.thumbnailUrl,
            fullText: data.fullText,
          }),
        }).catch(() => {});
        // Hide onboarding on first sift
        setShowOnboarding(false);
        setArticleCount(prev => (prev === 0 ? 1 : prev));
      }
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  // Demo sift: sift a popular article as an example
  const demoArticleUrl = 'https://www.quantamagazine.org/what-is-machine-learning-20240708/';
  const handleDemoSift = async () => {
    setUrl(demoArticleUrl);
    // Trigger the sift programmatically
    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSift(dummyEvent);
  };

  if (loadingAuth) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="animate-spin text-accent-400" size={32} />
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
        <GlassCard className="p-8 text-center max-w-md">
          <h1 className="text-3xl font-semibold text-surface-50 mb-3">Save articles. Sift them. Keep what matters.</h1>
          <p className="text-surface-400 mb-8">Sign in to start building your personal library.</p>
          <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition">
            Sign In to Sift
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-12 px-4 pb-24">
      {/* Onboarding flow – only for new users */}
      <AnimatePresence>
        {showOnboarding && articleCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-2xl mb-6"
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-accent-400" />
                <h2 className="text-lg font-semibold text-surface-50">Welcome to Sift 👋</h2>
              </div>
              <div className="space-y-4 text-sm text-surface-300">
                <p>
                  Sift uses AI to read articles and give you a verdict: <strong className="text-surface-200">Worth a full read</strong>, <strong className="text-surface-200">Skim this</strong>, or <strong className="text-surface-200">You can skip this</strong>. You also get a short summary and the best insight.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleDemoSift}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 transition"
                  >
                    <Zap className="w-4 h-4" />
                    Try an example article
                  </button>
                  <Link
                    href="/discover"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-800/60 border border-surface-700/50 text-surface-200 rounded-xl font-medium hover:bg-surface-700/60 transition"
                  >
                    <Rss className="w-4 h-4" />
                    Add your first feed
                  </Link>
                </div>
                <p className="text-xs text-surface-400 pt-1">
                  Or paste any link below. Sift works with almost any article, blog, or news story.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSift} className="w-full max-w-2xl flex flex-col gap-3">
        {!showManualFallback && (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setBatchMode(!batchMode)}
                className={`text-sm font-medium ${
                  batchMode ? 'text-accent-400' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {batchMode ? 'Single URL' : 'Batch URLs'}
              </button>
            </div>
            {batchMode ? (
              <GlassCard className="p-4">
                <textarea
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  placeholder="Paste URLs, one per line…"
                  className="w-full h-32 p-3 bg-surface-800/50 rounded-xl border border-surface-700 focus:ring-2 focus:ring-accent-400/50 resize-y text-surface-50 placeholder-surface-500 outline-none"
                  disabled={loading}
                />
              </GlassCard>
            ) : (
              <GlassCard className="flex items-center gap-3 p-2 pl-6">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a link to sift it"
                  className="flex-1 bg-transparent outline-none text-surface-50 placeholder-surface-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowManualFallback(true)}
                  className="text-surface-400 hover:text-accent-400 p-1"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>
              </GlassCard>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 flex items-center gap-2 transition"
              >
                {loading ? (
                  <><Loader2 className="animate-spin w-4 h-4" /> Sifting…</>
                ) : (
                  <>Sift <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <button
                type="button"
                disabled={loading || !url.trim()}
                onClick={async () => {
                  const res = await fetch('/api/queue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                  });
                  if (res.ok) {
                    toast.success('Saved to queue');
                    setUrl('');
                  } else {
                    toast.error('Could not save');
                  }
                }}
                className="px-5 py-2.5 bg-surface-800/60 border border-surface-700/50 text-surface-300 rounded-xl font-medium hover:bg-surface-700/60 disabled:opacity-50 flex items-center gap-2 transition"
              >
                Queue
              </button>
            </div>
          </>
        )}
        {showManualFallback && (
          <GlassCard className="flex flex-col gap-3 p-4">
            <p className="text-sm text-surface-400">This article couldn&apos;t be fetched automatically. Paste the full text below.</p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the article text here…"
              className="w-full h-40 p-3 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 resize-y outline-none focus:ring-2 focus:ring-accent-400/50"
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowManualFallback(false)} className="px-4 py-2 text-sm text-surface-400 hover:text-surface-200">Cancel</button>
              <button
                type="submit"
                disabled={loading || !manualText.trim()}
                className="px-5 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 flex items-center gap-2 transition"
              >
                {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Sifting…</> : <>Sift Text <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </GlassCard>
        )}
      </form>

      {!result && !loading && !showOnboarding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-400/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-accent-400" />
              </div>
              <h2 className="text-xl font-semibold text-surface-50">Ready to sift through content</h2>
              <p className="text-surface-400 max-w-md">
                Paste a URL or text, or upload a batch file. Sift will analyze and deliver a clear verdict.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <GlassCard className="w-full max-w-2xl p-6">
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-surface-800/50">
                {result.thumbnailUrl ? (
                  <Image
                    src={result.thumbnailUrl}
                    alt=""
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-500">
                    <ImageOff className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-700/50">
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      result.verdict === 'Worth a full read'
                        ? 'bg-verdict-green'
                        : result.verdict === 'Skim this'
                        ? 'bg-verdict-amber'
                        : 'bg-verdict-grey'
                    }`}
                  />
                  <span className="text-sm font-semibold text-surface-300">
                    {result.verdict}
                  </span>
                  <Sparkles className="w-4 h-4 text-accent-400 ml-auto" />
                </div>
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
                    TL;DR
                  </h3>
                  <p className="text-surface-200 leading-relaxed">
                    {result.summary}
                  </p>
                </div>
                {result.insight && (
                  <div className="bg-surface-800/60 rounded-xl p-4 border-l-4 border-accent-400 mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
                      Key Insight
                    </h3>
                    <p className="text-surface-300 italic leading-relaxed">
                      {result.insight}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <a
                    href={result.sourceUrl || url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent-400 hover:underline text-sm"
                  >
                    Read full article <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleListen}
                    disabled={audioPlaying}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                      audioPlaying
                        ? 'text-surface-500 cursor-not-allowed'
                        : 'text-accent-400 hover:underline'
                    }`}
                  >
                    {audioPlaying ? '🔊 Playing…' : '🎧 Listen'}
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}