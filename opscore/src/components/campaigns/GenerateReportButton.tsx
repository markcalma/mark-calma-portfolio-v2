'use client';

import { useState } from 'react';

interface GenerateReportButtonProps {
  campaignId: string;
  onComplete?: () => void;
}

export function GenerateReportButton({ campaignId, onComplete }: GenerateReportButtonProps) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  async function handleClick() {
    setState('running');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 15;
      });
    }, 800);

    try {
      const res = await fetch('/api/campaigns/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });

      clearInterval(interval);
      setProgress(100);

      if (res.ok) {
        setState('done');
        setTimeout(() => { onComplete?.(); }, 1500);
      } else {
        setState('error');
      }
    } catch {
      clearInterval(interval);
      setState('error');
    }
  }

  if (state === 'idle') {
    return (
      <button
        onClick={handleClick}
        className="text-xs font-semibold rounded-lg transition-opacity hover:opacity-80"
        style={{ background: '#4f46e5', color: '#fff', padding: '6px 14px' }}
      >
        Generate AI Report
      </button>
    );
  }

  if (state === 'running') {
    return (
      <div className="flex items-center gap-2" style={{ minWidth: 140 }}>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#4f46e5' }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {Math.round(progress)}%
        </span>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <span className="text-xs font-medium" style={{ color: '#15803d' }}>
        ✓ Report Ready
      </span>
    );
  }

  return (
    <button
      onClick={() => { setState('idle'); setProgress(0); }}
      className="text-xs font-medium"
      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      Error — retry
    </button>
  );
}
