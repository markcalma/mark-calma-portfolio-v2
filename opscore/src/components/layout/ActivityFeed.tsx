import { ActivityEntry } from '@/types/recruitment';

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <aside
      className="w-64 shrink-0 flex flex-col"
      style={{ borderLeft: '1px solid var(--color-border)' }}
    >
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Activity Feed
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="px-4 py-3 border-b text-xs"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p style={{ color: 'var(--color-text-primary)' }} className="leading-relaxed">
              {entry.message}
            </p>
            <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {timeAgo(entry.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
