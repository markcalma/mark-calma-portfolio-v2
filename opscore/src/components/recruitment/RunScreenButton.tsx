'use client';

import { useState } from 'react';

interface RunScreenButtonProps {
  jobId: string;
  applicantCount: number;
  onComplete?: () => void;
}

export function RunScreenButton({ jobId, applicantCount, onComplete }: RunScreenButtonProps) {
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
      const res = await fetch('/api/recruitment/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      clearInterval(interval);
      setProgress(100);

      if (res.ok) {
        setState('done');
        onComplete?.();
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
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        Run AI Screen
      </button>
    );
  }

  if (state === 'running') {
    return (
      <div className="flex items-center gap-2 min-w-32">
        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--color-accent)' }}
          />
        </div>
        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
          {Math.round(progress)}%
        </span>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
        Screening complete
      </span>
    );
  }

  return (
    <span className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
      Error - retry
    </span>
  );
}
