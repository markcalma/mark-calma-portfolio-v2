interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const color =
    score >= 80 ? 'var(--color-success)' :
    score >= 60 ? 'var(--color-warning)' :
    'var(--color-danger)';

  const fontSize = size === 'md' ? '1rem' : '0.75rem';
  const padding = size === 'md' ? '0.25rem 0.625rem' : '0.125rem 0.5rem';

  return (
    <span
      className="rounded-full font-semibold tabular-nums"
      style={{
        background: `${color}22`,
        color,
        fontSize,
        padding,
        border: `1px solid ${color}44`,
      }}
    >
      {score}/100
    </span>
  );
}
