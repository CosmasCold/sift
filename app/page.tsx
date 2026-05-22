'use client';

import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        if (resultsArr.length > 1) toast(`The other ${resultsArr.length - 1} article(s) are in your Library.`);
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
          }),
        }).catch(() => {});
      }
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  if (loadingAuth) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-purple-500" /></div>;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-3">Save articles. Sift them. Keep what matters.</h1>
          <p className="text-gray-400 mb-8">Sign in to start building your personal library.</p>
          <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition">Sign In to Sift</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-12 px-4">
      <form onSubmit={handleSift} className="w-full max-w-2xl flex flex-col gap-3">
        {!showManualFallback && (
          <>
            <div className="flex justify-end">
              <button type="button" onClick={() => setBatchMode(!batchMode)} className={`text-sm font-medium ${batchMode ? 'text-purple-500' : 'text-gray-400 hover:text-gray-200'}`}>
                {batchMode ? 'Single URL' : 'Batch URLs'}
              </button>
            </div>
            {batchMode ? (
              <textarea value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)} placeholder="Paste URLs, one per line…" className="w-full h-32 p-3 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500 resize-y text-white" disabled={loading} />
            ) : (
              <div className="flex items-center gap-3 p-2 pl-6 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 focus-within:ring-2 focus-within:ring-purple-500">
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link to sift it" className="flex-1 bg-transparent outline-none text-white placeholder-gray-500" disabled={loading} />
                <button type="button" onClick={() => setShowManualFallback(true)} className="text-gray-400 hover:text-purple-500"><ClipboardList className="w-5 h-5" /></button>
              </div>
            )}
            <button type="submit" disabled={loading} className="self-start mt-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Sifting…</> : <>Sift <ArrowRight className="w-4 h-4" /></>}
            </button>
          </>
        )}
        {showManualFallback && (
          <div className="flex flex-col gap-3 p-4 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800">
            <p className="text-sm text-gray-400">This article couldn&apos;t be fetched automatically. Paste the full text below.</p>
            <textarea value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Paste the article text here…" className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white resize-y" disabled={loading} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowManualFallback(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={loading || !manualText.trim()} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Sifting…</> : <>Sift Text <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </form>

      {!result && !loading && (
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl px-6 py-3">
          <p className="text-gray-400 text-sm">Paste a link to start sifting.</p>
        </div>
      )}

      {result && (
        <div className="w-full max-w-2xl bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-800">
            <span className={`w-3.5 h-3.5 rounded-full ${result.verdict === 'Worth a full read' ? 'bg-green-500' : result.verdict === 'Skim this' ? 'bg-yellow-600' : 'bg-gray-500'}`} />
            <span className="text-sm font-semibold text-gray-300">{result.verdict}</span>
            <Sparkles className="w-4 h-4 text-purple-500 ml-auto" />
          </div>
          <div className="mb-5"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">TL;DR</h3><p className="text-gray-200 leading-relaxed">{result.summary}</p></div>
          {result.insight && (<div className="bg-gray-800/60 rounded-xl p-4 border-l-4 border-purple-500 mb-5"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Key Insight</h3><p className="text-gray-300 italic leading-relaxed">{result.insight}</p></div>)}
          <div className="flex items-center gap-4 mt-4">
            <a href={result.sourceUrl || url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-purple-500 hover:underline text-sm">Read full article <ArrowRight className="w-3.5 h-3.5" /></a>
            <button onClick={handleListen} disabled={audioPlaying} className={`inline-flex items-center gap-1.5 text-sm font-medium ${audioPlaying ? 'text-gray-500 cursor-not-allowed' : 'text-purple-500 hover:underline'}`}>{audioPlaying ? '🔊 Playing…' : '🎧 Listen'}</button>
          </div>
        </div>
      )}
    </div>
  );
}