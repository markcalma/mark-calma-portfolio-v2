import Link from 'next/link';

interface ModuleCardProps {
  name: string;
  description: string;
  icon: string;
  href: string;
  status: 'active' | 'coming-soon';
}

export function ModuleCard({ name, description, icon, href, status }: ModuleCardProps) {
  const isActive = status === 'active';

  const card = (
    <div
      className="rounded-xl p-5 transition-colors group"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
        opacity: isActive ? 1 : 0.5,
        cursor: isActive ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {status === 'coming-soon' && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Coming Soon
          </span>
        )}
        {status === 'active' && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-accent)' }}
          >
            Live
          </span>
        )}
      </div>
      <h3
        className="font-semibold text-sm mb-1"
        style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
      >
        {name}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {description}
      </p>
    </div>
  );

  if (isActive) {
    return <Link href={href} className="block no-underline">{card}</Link>;
  }

  return card;
}
