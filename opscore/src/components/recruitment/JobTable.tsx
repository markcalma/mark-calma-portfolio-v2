import Link from 'next/link';
import { Job, JobStatus } from '@/types/recruitment';

const STATUS_STYLES: Record<JobStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'var(--color-text-muted)', bg: 'var(--color-border)' },
  screening: { label: 'Screening', color: 'var(--color-warning)', bg: 'rgba(234,179,8,0.1)' },
  interviewing: { label: 'Interviewing', color: 'var(--color-accent)', bg: 'rgba(99,102,241,0.1)' },
  filled: { label: 'Filled', color: 'var(--color-success)', bg: 'rgba(34,197,94,0.1)' },
};

interface JobTableProps {
  jobs: Job[];
}

export function JobTable({ jobs }: JobTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Role', 'Client', 'Applicants', 'Screened', 'Top Candidates', 'Status', 'Action'].map(h => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => {
            const s = STATUS_STYLES[job.status];
            const isUnscreened = job.screened === 0;
            return (
              <tr
                key={job.id}
                style={{ borderBottom: '1px solid var(--color-border)' }}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {job.role}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                  {job.client}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {job.applicantCount}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {job.screened}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {job.topCandidates > 0 ? job.topCandidates : '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: s.color, background: s.bg }}
                  >
                    {s.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isUnscreened ? (
                    <div id={`run-screen-${job.id}`} />
                  ) : (
                    <Link
                      href={`/recruitment/applicants/${job.id}`}
                      className="text-xs no-underline font-medium"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      View applicants
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
