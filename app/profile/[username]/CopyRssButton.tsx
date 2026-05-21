'use client';

import { useState } from 'react';

export default function CopyRssButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const feedUrl = `${window.location.origin}/profile/${username}/feed.xml`;
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 rounded-full px-3 py-1 text-sm transition text-stone-800 dark:text-stone-200 shadow-sm"
    >
      📡 {copied ? 'Copied!' : 'Copy RSS Feed'}
    </button>
  );
}