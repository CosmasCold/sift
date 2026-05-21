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
      className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-full px-3 py-1 text-sm transition"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}