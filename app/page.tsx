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
  const [batchResults, setBatchResults] = useState<SiftResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);

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
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loadingAuth) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-accent w-6 h-6" /></div>;
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-3">Save articles. Sift them. Keep what matters.</h1>
          <p className="text-stone-300 mb-8">Sign in to start building your personal library of sifted articles.</p>
          <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors">
            <LogIn className="w-4 h-4" /> Sign In to Sift
          </Link>
        </motion.div>
      </main>
    );
  }

  const handleListen = async () => {
    if (!result) return;
    try {
      const res = await fetch('/api/listen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: result.summary }) });
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
    if (batchMode) {
      const lines = batchUrls.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;
      setLoading(true);
      setBatchResults([]);
      setResult(null);
      const resultsArr: SiftResult[] = [];
      for (const u of lines) {
        try {
          const res = await fetch('/api/sift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u }) });
          const data = await res.json();
          if (!data.error) {
            resultsArr.push(data);
            fetch('/api/save-sift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u, sourceUrl: data.sourceUrl, summary: data.summary, insight: data.insight, verdict: data.verdict }) }).catch(() => {});
          }
        } catch {}
      }
      setLoading(false);
      if (resultsArr.length > 0) {
        setResult(resultsArr[0]);
        setBatchResults(resultsArr);
        toast.success(`Sifted ${resultsArr.length} article${resultsArr.length > 1 ? 's' : ''}`);
        if (resultsArr.length > 1) toast(`The other ${resultsArr.length - 1} article(s) are listed below.`);
      } else toast.error('Could not sift any of the URLs');
      setBatchUrls('');
      return;
    }

    const textToSend = showManualFallback ? manualText.trim() : '';
    if (!showManualFallback && !url.trim()) return;
    if (showManualFallback && !textToSend) { toast.error('Please paste the article text.'); return; }
    setLoading(true);
    setResult(null);
    setBatchResults([]);
    try {
      const res = await fetch('/api/sift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, manualText: textToSend }) });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        if (data.needsManualFallback) setShowManualFallback(true);
      } else {
        setResult(data);
        setShowManualFallback(false);
        setManualText('');
        fetch('/api/save-sift', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, sourceUrl: data.sourceUrl, summary: data.summary, insight: data.insight, verdict: data.verdict }) }).catch(() => {});
      }
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  const verdictDot = { 'Worth a full read': 'bg-green-500', 'Skim this': 'bg-amber-500', 'You can skip this': 'bg-stone-500' };

  return (
    <div className="flex flex-col items-center gap-8 pt-12 md:pt-16">
      <motion.form onSubmit={handleSift} className="w-full max-w-2xl md:max-w-3xl flex flex-col gap-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {!showManualFallback && (
          <>
            <div className="flex justify-end mb-1">
              <button type="button" onClick={() => setBatchMode(!batchMode)} className={`text-sm font-medium transition-colors ${batchMode ? 'text-accent' : 'text-stone-300 hover:text-accent'}`}>
                {batchMode ? 'Single URL' : 'Batch URLs'}
              </button>
            </div>
            {batchMode ? (
              <textarea value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)} placeholder="Paste URLs, one per line…" className="card w-full h-32 resize-y" disabled={loading} />
            ) : (
              <div className="card flex items-center gap-3 p-2 pl-6 transition-all focus-within:ring-2 focus-within:ring-accent">
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link to sift it" className="flex-1 bg-transparent outline-none text-white placeholder-stone-400" disabled={loading} />
                <button type="button" onClick={() => setShowManualFallback(true)} className="text-stone-400 hover:text-accent transition-colors" title="Paste text manually"><ClipboardList className="w-5 h-5" /></button>
              </div>
            )}
            <button type="submit" disabled={loading} className="self-start mt-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2">
              {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Sifting…</> : <>Sift <ArrowRight className="w-4 h-4" /></>}
            </button>
          </>
        )}
        {showManualFallback && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm text-stone-400">This article couldn&apos;t be fetched automatically. Paste the full text below.</p>
            <textarea value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Paste the article text here…" className="w-full h-40 bg-stone-800 border border-stone-700 rounded-xl p-3 resize-y focus:ring-accent" disabled={loading} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowManualFallback(false)} className="px-4 py-2 text-sm text-stone-300 hover:text-white">Cancel</button>
              <button type="submit" disabled={loading || !manualText.trim()} className="px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover disabled:opacity-50 flex items-center gap-2">
                {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Sifting…</> : <>Sift Text <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </motion.form>

      {!result && !loading && !batchResults.length && (
        <div className="card px-6 py-3 text-center">
          <p className="text-stone-400 text-sm">Paste a link to start sifting.</p>
        </div>
      )}

      {loading && (
        <div className="card w-full max-w-2xl animate-pulse">
          <div className="h-3 w-3 rounded-full bg-stone-600 mb-4" />
          <div className="h-4 w-32 bg-stone-700 rounded mb-3" />
          <div className="h-4 w-full bg-stone-700 rounded mb-2" />
          <div className="h-4 w-3/4 bg-stone-700 rounded mb-6" />
          <div className="h-4 w-24 bg-stone-700 rounded" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={result.sourceUrl} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="card w-full max-w-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-700">
              <span className={`w-3.5 h-3.5 rounded-full ${verdictDot[result.verdict]} ring-2 ring-offset-2 ring-offset-stone-800`} />
              <span className="text-sm font-semibold text-stone-200">{result.verdict}</span>
              <Sparkles className="w-4 h-4 text-accent ml-auto" />
            </div>
            <div className="mb-5"><h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">TL;DR</h3><p className="text-stone-200 leading-relaxed">{result.summary}</p></div>
            {result.insight && (<div className="bg-stone-800/60 rounded-xl p-4 border-l-4 border-accent mb-5"><h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Key Insight</h3><p className="text-stone-300 italic leading-relaxed">{result.insight}</p></div>)}
            <div className="flex items-center gap-4 mt-4">
              <a href={result.sourceUrl || url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm">Read full article <ArrowRight className="w-3.5 h-3.5" /></a>
              <button onClick={handleListen} disabled={audioPlaying} className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${audioPlaying ? 'text-stone-500 cursor-not-allowed' : 'text-accent hover:underline'}`}>{audioPlaying ? '🔊 Playing…' : '🎧 Listen'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {batchMode && batchResults.length > 1 && (
        <div className="card w-full max-w-2xl mt-4">
          <h3 className="font-medium text-stone-200 mb-2">All sifted articles ({batchResults.length})</h3>
          <div className="space-y-2">
            {batchResults.map((item, idx) => (
              <div key={idx} className="text-sm text-stone-300 pb-2 last:border-0 border-b border-stone-700">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.summary.substring(0, 80)}…</a>
                <span className="text-xs text-stone-400 ml-2">({item.verdict})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}