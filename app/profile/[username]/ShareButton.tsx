'use client';

import { useState } from 'react';

export default function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${username}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 rounded-full px-3 py-1 text-sm transition text-stone-800 dark:text-stone-200 shadow-sm"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}