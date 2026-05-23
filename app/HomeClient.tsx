'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  Sparkles,
  ClipboardList,
  ImageOff,
  Zap,
  Rss,
  Clock,
  Users,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { GlassCard } from '@/components/ui/GlassCard';

interface SiftResult {
  summary: string;
  insight: string;
  verdict: 'Worth a full read' | 'Skim this' | 'You can skip this';
  sourceUrl?: string;
  readingTime?: number;
  thumbnailUrl?: string | null;
  fullText?: string;
}

interface RecentSift {
  id: string;
  summary: string;
  verdict: string;
  created_at: string;
  thumbnail_url: string | null;
  source_url: string | null;
  reading_time: number | null;
}

interface WeeklyStats {
  kept: number;
  skimmed: number;
  skipped: number;
}

interface NetworkRecommendation {
  id: string;
  summary: string;
  verdict: string;
  source_url: string | null;
  thumbnail_url: string | null;
  username: string;
  avatar_url: string | null;
}

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [articleCount, setArticleCount] = useState<number | null>(null);

  // Dashboard state
  const [recentSifts, setRecentSifts] = useState<RecentSift[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [networkRecommendation, setNetworkRecommendation] = useState<NetworkRecommendation | null>(null);

  // ---- Auth ----
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

  // ---- Exchange code from Supabase redirect (Google / Magic Link) ----
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && user) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        // Clean the URL so the code parameter doesn't stay visible
        router.replace('/');
      });
    }
  }, [searchParams, user, router]);

  // ---- Dashboard refresh ----
  const refreshDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const { data: recent } = await supabase
        .from('sifted_articles')
        .select('id, summary, verdict, created_at, thumbnail_url, source_url, reading_time')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentSifts(recent || []);
    } catch {
      // Silently fail; dashboard is optional
    }
  }, [user]);

  const refreshDashboardRef = useRef(refreshDashboard);
  useEffect(() => {
    refreshDashboardRef.current = refreshDashboard;
  }, [refreshDashboard]);

  // ---- Onboarding check & dashboard fetch ----
  useEffect(() => {
    if (!user) return;
    const checkAndFetch = async () => {
      const { count, error } = await supabase
        .from('sifted_articles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!error && count !== null) {
        setArticleCount(count);
        if (count === 0) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
          try {
            // Recent sifts
            const { data: recent } = await supabase
              .from('sifted_articles')
              .select('id, summary, verdict, created_at, thumbnail_url, source_url, reading_time')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5);
            setRecentSifts(recent || []);

            // Weekly stats
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: weekly } = await supabase
              .from('sifted_articles')
              .select('verdict')
              .eq('user_id', user.id)
              .gte('created_at', weekAgo.toISOString());
            const stats: WeeklyStats = { kept: 0, skimmed: 0, skipped: 0 };
            (weekly || []).forEach(a => {
              if (a.verdict === 'Worth a full read') stats.kept++;
              else if (a.verdict === 'Skim this') stats.skimmed++;
              else stats.skipped++;
            });
            setWeeklyStats(stats);

            // Network recommendation
            const { data: follows } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', user.id);
            const followedIds = (follows || []).map(f => f.following_id);
            if (followedIds.length > 0) {
              const { data: existing } = await supabase
                .from('sifted_articles')
                .select('source_url')
                .eq('user_id', user.id);
              const existingUrls = new Set((existing || []).map(a => a.source_url).filter(Boolean));

              const { data: network } = await supabase
                .from('sifted_articles')
                .select('id, summary, verdict, source_url, thumbnail_url, user_id, user_profiles!user_id(username, avatar_url)')
                .in('user_id', followedIds)
                .eq('kept', true)
                .order('created_at', { ascending: false })
                .limit(10);

              if (network) {
                interface NetworkRow {
                  id: string;
                  summary: string;
                  verdict: string;
                  source_url: string | null;
                  thumbnail_url: string | null;
                  user_id: string;
                  user_profiles: { username: string; avatar_url: string | null } | null;
                }
                const typedNetwork = network as unknown as NetworkRow[];
                const rec = typedNetwork.find(a => !existingUrls.has(a.source_url));
                if (rec) {
                  setNetworkRecommendation({
                    id: rec.id,
                    summary: rec.summary,
                    verdict: rec.verdict,
                    source_url: rec.source_url,
                    thumbnail_url: rec.thumbnail_url,
                    username: rec.user_profiles?.username || 'reader',
                    avatar_url: rec.user_profiles?.avatar_url || null,
                  });
                }
              }
            }
          } catch {
            // Silently fail; dashboard is optional
          }
        }
      }
    };
    checkAndFetch();
  }, [user]);

  // ---- Sift logic ----
  const handleSift = useCallback(async (e: React.FormEvent, overrideUrl?: string) => {
    e.preventDefault();

    const targetUrl = overrideUrl ?? url;

    // Batch mode
    if (batchMode && !overrideUrl) {
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
                readingTime: data.readingTime,
                thumbnailUrl: data.thumbnailUrl,
                fullText: data.fullText,
              }),
            }).catch(() => {});
          }
        } catch {
          // Continue to next URL
        }
      }
      setLoading(false);
      if (resultsArr.length > 0) {
        setResult(resultsArr[0]);
        toast.success(`Sifted ${resultsArr.length} article${resultsArr.length > 1 ? 's' : ''}`);
        if (resultsArr.length > 1)
          toast(`The other ${resultsArr.length - 1} article(s) are in your Library.`);
        setShowOnboarding(false);
        setArticleCount(prev => (prev === 0 ? 1 : (prev ?? 0) + 1));
        refreshDashboardRef.current();
      } else toast.error('Could not sift any of the URLs');
      setBatchUrls('');
      return;
    }

    // Single mode
    const textToSend = showManualFallback ? manualText.trim() : '';
    if (!showManualFallback && !targetUrl.trim()) return;
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
        body: JSON.stringify({ url: targetUrl, manualText: textToSend }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        if (data.needsManualFallback) setShowManualFallback(true);
      } else {
        setResult(data);
        setShowManualFallback(false);
        setManualText('');
        if (!overrideUrl) setUrl('');
        fetch('/api/save-sift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl,
            sourceUrl: data.sourceUrl,
            summary: data.summary,
            insight: data.insight,
            verdict: data.verdict,
            readingTime: data.readingTime,
            thumbnailUrl: data.thumbnailUrl,
            fullText: data.fullText,
          }),
        }).catch(() => {});
        setShowOnboarding(false);
        setArticleCount(prev => (prev === 0 ? 1 : (prev ?? 0) + 1));
        refreshDashboardRef.current();
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [url, batchMode, batchUrls, showManualFallback, manualText]);

  const handleSiftRef = useRef(handleSift);
  useEffect(() => {
    handleSiftRef.current = handleSift;
  }, [handleSift]);

  // ---- Browser extension support ----
  useEffect(() => {
    const siftUrl = searchParams.get('sift');
    const queueUrl = searchParams.get('queue');

    if (siftUrl || queueUrl) {
      router.replace('/');
    }

    if (siftUrl && user && !loading) {
      const timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSiftRef.current(fakeEvent, siftUrl);
      }, 100);
      return () => clearTimeout(timer);
    } else if (queueUrl && user) {
      fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: queueUrl }),
      })
        .then(res => {
          if (res.ok) toast.success('Saved to queue!');
          else toast.error('Could not save to queue');
        })
        .catch(() => toast.error('Could not save to queue'));
    }
  }, [searchParams, user, loading, router]);

  // ---- Listen ----
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
    } catch {
      toast.error('Something went wrong');
    }
  };

  // ---- Demo sift ----
  const demoArticleUrl = 'https://www.quantamagazine.org/what-is-machine-learning-20240708/';
  const handleDemoSift = async () => {
    setUrl(demoArticleUrl);
    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
    setTimeout(() => {
      handleSiftRef.current(dummyEvent, demoArticleUrl);
    }, 50);
  };

  // ---- Render ----
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-accent-400" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
        <GlassCard className="p-8 text-center max-w-md">
          <h1 className="text-3xl font-semibold text-surface-50 mb-3">
            Save articles. Sift them. Keep what matters.
          </h1>
          <p className="text-surface-400 mb-8">
            Sign in to start building your personal library.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition"
          >
            Sign In to Sift
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-12 px-4 pb-24">
      {/* Onboarding */}
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

      {/* Sift input – always visible */}
      <form onSubmit={(e) => handleSift(e)} className="w-full max-w-2xl flex flex-col gap-3">
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
                  aria-label="Paste article text manually"
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
            <p className="text-sm text-surface-400">
              This article couldn&apos;t be fetched automatically. Paste the full text below.
            </p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the article text here…"
              className="w-full h-40 p-3 bg-surface-800/50 border border-surface-700 rounded-xl text-surface-50 placeholder-surface-500 resize-y outline-none focus:ring-2 focus:ring-accent-400/50"
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualFallback(false)}
                className="px-4 py-2 text-sm text-surface-400 hover:text-surface-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !manualText.trim()}
                className="px-5 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 flex items-center gap-2 transition"
              >
                {loading ? (
                  <><Loader2 className="animate-spin w-4 h-4" /> Sifting…</>
                ) : (
                  <>Sift Text <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </GlassCard>
        )}
      </form>

      {/* Active result card */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-2xl"
        >
          <GlassCard className="p-6">
            <div className="flex gap-4">
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
                  <span className="text-sm font-semibold text-surface-300">{result.verdict}</span>
                  <Sparkles className="w-4 h-4 text-accent-400 ml-auto" />
                </div>
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
                    TL;DR
                  </h3>
                  <p className="text-surface-200 leading-relaxed">{result.summary}</p>
                </div>
                {result.insight && (
                  <div className="bg-surface-800/60 rounded-xl p-4 border-l-4 border-accent-400 mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
                      Key Insight
                    </h3>
                    <p className="text-surface-300 italic leading-relaxed">{result.insight}</p>
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
                      audioPlaying ? 'text-surface-500 cursor-not-allowed' : 'text-accent-400 hover:underline'
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

      {/* Dashboard – personal reading journal */}
      {!showOnboarding && articleCount !== null && articleCount > 0 && !result && (
        <div className="w-full max-w-2xl space-y-6 mt-4">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="w-5 h-5 text-accent-400" />
            <h2 className="text-lg font-semibold text-surface-50">Your reading journal</h2>
          </div>

          {weeklyStats && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-4">
                <p className="text-sm text-surface-300">
                  This week you&apos;ve{' '}
                  <span className="text-verdict-green font-medium">kept {weeklyStats.kept}</span>
                  {weeklyStats.skimmed > 0 && (
                    <>, <span className="text-verdict-amber font-medium">skimmed {weeklyStats.skimmed}</span></>
                  )}
                  {weeklyStats.skipped > 0 && (
                    <>, <span className="text-surface-400 font-medium">skipped {weeklyStats.skipped}</span></>
                  )}
                  {' '}article{weeklyStats.kept + weeklyStats.skimmed + weeklyStats.skipped !== 1 ? 's' : ''}.
                </p>
              </GlassCard>
            </motion.div>
          )}

          {networkRecommendation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <GlassCard className="p-4">
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> From your network
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-700 flex-shrink-0">
                    {networkRecommendation.thumbnail_url ? (
                      <Image
                        src={networkRecommendation.thumbnail_url}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-400 text-xs">📄</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 line-clamp-2">{networkRecommendation.summary}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-surface-400">
                      <span>{networkRecommendation.verdict}</span>
                      <span>·</span>
                      <Link href={`/profile/${networkRecommendation.username}`} className="text-accent-400 hover:underline">
                        @{networkRecommendation.username}
                      </Link>
                    </div>
                  </div>
                  {networkRecommendation.source_url && (
                    <a
                      href={networkRecommendation.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-400 hover:underline text-sm flex-shrink-0"
                    >
                      Read
                    </a>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {recentSifts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-sm font-semibold text-surface-400 mb-3 px-1">Recently sifted</h3>
              <div className="space-y-3">
                {recentSifts.map(sift => (
                  <GlassCard key={sift.id} variant="interactive" className="p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          sift.verdict === 'Worth a full read'
                            ? 'bg-verdict-green'
                            : sift.verdict === 'Skim this'
                            ? 'bg-verdict-amber'
                            : 'bg-verdict-grey'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-200 line-clamp-1">{sift.summary}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-surface-400">
                          <span>{new Date(sift.created_at).toLocaleDateString()}</span>
                          {sift.reading_time && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {sift.reading_time} min
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {sift.source_url && (
                        <a
                          href={sift.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-400 hover:underline text-sm flex-shrink-0"
                        >
                          Read
                        </a>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          <div className="text-center pt-2">
            <Link
              href="/library"
              className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-accent-400 transition"
            >
              View full library <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}