'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const from = searchParams.get('from') ?? '/dashboard';
      router.push(from);
    } else {
      setError('Incorrect password.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm flex flex-col items-center gap-10 text-center">

        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-medium tracking-widest text-zinc-400 uppercase">OpsCore</p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
            Operations<br />Command Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Restricted access. Authorised users only.</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-32 bg-transparent text-zinc-900 placeholder-zinc-300 text-base px-0 py-3 outline-none border-b border-zinc-200 focus:border-zinc-900 transition-all text-center"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="text-zinc-900 hover:text-zinc-400 text-sm font-semibold mt-1 transition-colors disabled:opacity-40"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <p className="text-zinc-300 text-xs">
          Built by Mark Calma - Automation Agency
        </p>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
