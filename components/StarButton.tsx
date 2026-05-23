'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StarButton({ collectionId }: { collectionId: string }) {
  const [starred, setStarred] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections/star?collectionId=${collectionId}`)
      .then(r => r.json())
      .then(data => {
        setStarred(data.isStarred);
        setCount(data.count || 0);
        setLoading(false);
      });
  }, [collectionId]);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch('/api/collections/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId }),
    });
    const data = await res.json();
    if (res.ok) {
      setStarred(data.starred);
      setCount(prev => data.starred ? prev + 1 : prev - 1);
    } else {
      toast.error('Could not update star');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 text-xs transition ${
        starred ? 'text-yellow-400' : 'text-surface-400 hover:text-yellow-400'
      }`}
      aria-label={starred ? 'Unstar collection' : 'Star collection'}
    >
      <Star className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
      <span>{count}</span>
    </button>
  );
}