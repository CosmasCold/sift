'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Trash2, BookOpen, ThumbsUp, ThumbsDown, Search, Archive, CheckCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface Feed { id: string; title: string | null; }
interface SiftEntry {
  id: string; url: string | null; source_url: string | null; summary: string; insight: string;
  verdict: 'Worth a full read' | 'Skim this' | 'You can skip this';
  feedback: 'agree' | 'disagree' | null; kept: boolean; created_at: string; feed: Feed | null; tags: string[];
}

const getDateGroup = (date: Date) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'This Week';
  return 'Earlier';
};

export default function LibraryPage() {
  const [articles, setArticles] = useState<SiftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'kept' | 'discarded'>('kept');
  const [search, setSearch] = useState('');
  const [feedFilter, setFeedFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/library').then(r=>r.json()).then(data=>setArticles(data.articles||[])).catch(()=>toast.error('Failed to load library')).finally(()=>setLoading(false));
  }, []);

  const toggleKeep = async (id:string, kept:boolean) => {
    const newKept = !kept;
    setArticles(prev=>prev.map(a=>a.id===id?{...a,kept:newKept}:a));
    try {
      await fetch('/api/toggle-keep', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,kept:newKept})});
    } catch { setArticles(prev=>prev.map(a=>a.id===id?{...a,kept:kept}:a)); toast.error('Failed'); }
  };
  const handleDelete = async (id:string) => {
    const res = await fetch('/api/delete-sift',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
    if(res.ok){setArticles(prev=>prev.filter(a=>a.id!==id)); toast.success('Removed');} else toast.error('Failed');
  };
  const handleFeedback = async (id:string, fb:'agree'|'disagree') => {
    const current = articles.find(a=>a.id===id);
    if(!current) return;
    const newFb = current.feedback===fb?null:fb;
    setArticles(prev=>prev.map(a=>a.id===id?{...a,feedback:newFb}:a));
    const res = await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,feedback:newFb})});
    if(!res.ok) { setArticles(prev=>prev.map(a=>a.id===id?{...a,feedback:current.feedback}:a)); toast.error('Failed'); }
  };
  const updateTags = async (articleId:string, newTags:string[]) => {
    const res = await fetch('/api/update-tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({articleId,tags:newTags})});
    if(res.ok){ setArticles(prev=>prev.map(a=>a.id===articleId?{...a,tags:newTags}:a)); toast.success('Tags updated'); } else toast.error('Failed');
  };

  const filtered = articles.filter(a=>filter==='kept'?a.kept:filter==='discarded'?!a.kept:true).filter(a=>a.summary.toLowerCase().includes(search.toLowerCase()));
  const final = feedFilter==='all'?filtered:filtered.filter(a=>a.feed?.id===feedFilter);
  const grouped = useMemo(()=>{
    const groups:Record<string,SiftEntry[]>={};
    for(const a of final){ const g=getDateGroup(new Date(a.created_at)); if(!groups[g]) groups[g]=[]; groups[g].push(a); }
    return groups;
  },[final]);
  const feedsList = useMemo(()=>{
    const feeds=new Map<string,string>();
    articles.forEach(a=>{if(a.feed?.id&&a.feed.title) feeds.set(a.feed.id,a.feed.title);});
    return Array.from(feeds.entries()).map(([id,title])=>({id,title}));
  },[articles]);

  if(loading) return <div className="flex justify-center pt-16"><div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" /></div>;

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Your Library</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">{articles.length} sifted</span>
          <button onClick={async()=>{const res=await fetch('/api/surprise'); const data=await res.json(); if(data.article){ setExpandedId(data.article.id); setFilter('all'); setSearch(''); toast.success('Found one!'); setTimeout(()=>{document.getElementById(`article-${data.article.id}`)?.scrollIntoView({behavior:'smooth',block:'center'});},100); } else toast.error('Nothing to surprise you with');}} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">Surprise Me</button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {[{label:'Kept',value:'kept'},{label:'Discarded',value:'discarded'},{label:'All',value:'all'}].map(({label,value})=>(
            <button key={value} onClick={()=>setFilter(value as 'kept' | 'discarded' | 'all')} className={`px-4 py-2 text-sm font-medium ${filter===value ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-200'}`}>{label}</button>
          ))}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search summaries…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        {feedsList.length>0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select value={feedFilter} onChange={e=>setFeedFilter(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500">
              <option value="all">All sources</option>
              {feedsList.map(f=> <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {final.length===0 ? (
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-10 text-center"><BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">Nothing found.</p></div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(grouped).map(([groupName, articles]) => (
            <div key={groupName}>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 px-1">{groupName}</h2>
              <div className="grid gap-4">
                {articles.map(article => (
                  <motion.div id={`article-${article.id}`} key={article.id} layout className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-5 transition-shadow hover:shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${article.verdict==='Worth a full read'?'bg-green-500':article.verdict==='Skim this'?'bg-yellow-600':'bg-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white line-clamp-2">{article.summary}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(article.created_at).toLocaleDateString()}{article.feed?.title && ` · from ${article.feed.title}`}</p>
                          {article.tags?.length>0 && <div className="flex flex-wrap gap-1 mt-2">{article.tags.map((tag:string)=><span key={tag} className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">#{tag}</span>)}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={()=>toggleKeep(article.id, article.kept)} className="p-1 rounded-md hover:bg-gray-800">{article.kept?<CheckCircle className="w-4 h-4 text-green-500"/>:<Archive className="w-4 h-4 text-gray-400"/>}</button>
                        <button onClick={()=>handleFeedback(article.id,'agree')} className={`p-1 rounded-md ${article.feedback==='agree'?'text-green-500':'text-gray-400'}`}><ThumbsUp className="w-4 h-4"/></button>
                        <button onClick={()=>handleFeedback(article.id,'disagree')} className={`p-1 rounded-md ${article.feedback==='disagree'?'text-yellow-600':'text-gray-400'}`}><ThumbsDown className="w-4 h-4"/></button>
                        <button onClick={()=>setExpandedId(expandedId===article.id?null:article.id)} className="text-purple-500 hover:underline text-sm">{expandedId===article.id?'Close':'Read'}</button>
                        <button onClick={()=>handleDelete(article.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedId===article.id && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                          <div className="pt-4 mt-4 border-t border-gray-800 space-y-3">
                            <p className="text-gray-300 text-sm leading-relaxed">{article.summary}</p>
                            {article.insight && <div className="bg-gray-800/50 rounded-xl p-3 border-l-4 border-purple-500"><p className="text-gray-300 italic text-sm">{article.insight}</p></div>}
                            {article.source_url && <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-500 hover:underline text-sm">Read original <ArrowRight className="w-3 h-3"/></a>}
                            <div><label className="text-xs font-medium text-gray-400 block mb-1">Tags (comma separated)</label><form onSubmit={async(e)=>{e.preventDefault(); const fd=new FormData(e.currentTarget); const input=fd.get('tags')?.toString().trim(); const newTags=input?input.split(',').map(t=>t.trim()).filter(t=>t):[]; await updateTags(article.id,newTags);}} className="flex gap-2"><input name="tags" defaultValue={(article.tags||[]).join(', ')} placeholder="e.g., AI, design" className="flex-1 px-2 py-1 text-sm border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-purple-500" /><button type="submit" className="px-3 py-1 text-sm bg-purple-500/20 text-purple-500 rounded-lg hover:bg-purple-500/30">Save</button></form></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}