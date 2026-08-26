'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Job Pipeline', href: '/recruitment', exact: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-52 shrink-0 flex flex-col"
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
    >
      <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Link href="/dashboard" className="block no-underline">
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
            OpsCore
          </p>
        </Link>
        <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Apex Staffing Co.
        </p>
      </div>

      <div className="px-3 py-4">
        <p className="text-xs uppercase tracking-widest px-2 mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Recruitment
        </p>
        {NAV_ITEMS.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-2 py-2 rounded-lg text-sm transition-colors no-underline"
              style={{
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                background: isActive ? 'var(--color-border)' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-4 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <Link href="/dashboard" className="text-xs no-underline" style={{ color: 'var(--color-text-muted)' }}>
          ← All Modules
        </Link>
      </div>
    </aside>
  );
}
