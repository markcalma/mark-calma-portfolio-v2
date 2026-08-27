interface Stat {
  label: string;
  value: string | number;
}

interface HeaderProps {
  title: string;
  stats: Stat[];
}

export function Header({ title, stats }: HeaderProps) {
  return (
    <div
      className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <h1 className="text-base font-semibold flex-1" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h1>
      <div className="flex gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="text-right">
            <p className="text-lg font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>
              {stat.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
