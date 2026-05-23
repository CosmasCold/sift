'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportButtonProps {
  contentType: 'article' | 'collection' | 'profile';
  contentId: string;
  className?: string;
}

export default function ReportButton({ contentType, contentId, className = '' }: ReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!window.confirm('Report this content?')) return;
    setLoading(true);
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, contentId }),
    });
    if (res.ok) {
      toast.success('Reported. Thank you.');
    } else {
      toast.error('Could not submit report.');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleReport}
      disabled={loading}
      aria-label="Report content"
      className={`p-1 text-surface-400 hover:text-red-400 transition ${className}`}
      title="Report"
    >
      <Flag className="w-4 h-4" />
    </button>
  );
}