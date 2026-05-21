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
      type="button"
      onClick={handleCopy}
      className="text-sm bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1 rounded-full transition-colors flex items-center gap-1"
      title="Copy RSS feed URL"
    >
      📡 {copied ? 'Copied!' : 'Copy RSS Feed'}
    </button>
  );
}