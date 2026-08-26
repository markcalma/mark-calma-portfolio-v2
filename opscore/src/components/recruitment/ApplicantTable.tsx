'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Applicant, ApplicantStatus } from '@/types/recruitment';
import { ScoreBadge } from './ScoreBadge';

const STATUS_LABELS: Record<ApplicantStatus, string> = {
  shortlisted: 'Shortlisted',
  pending: 'Pending',
  rejected: 'Rejected',
  'questions-sent': 'Questions Sent',
  'interview-scheduled': 'Interview Scheduled',
};

const STATUS_COLORS: Record<ApplicantStatus, string> = {
  shortlisted: 'var(--color-success)',
  pending: 'var(--color-warning)',
  rejected: 'var(--color-danger)',
  'questions-sent': 'var(--color-accent)',
  'interview-scheduled': 'var(--color-accent)',
};

type FilterTab = 'all' | 'shortlisted' | 'pending' | 'rejected';

interface ApplicantTableProps {
  applicants: Applicant[];
  jobId: string;
}

export function ApplicantTable({ applicants, jobId }: ApplicantTableProps) {
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = filter === 'all'
    ? applicants
    : applicants.filter(a => {
        if (filter === 'shortlisted') return a.status === 'shortlisted' || a.status === 'questions-sent' || a.status === 'interview-scheduled';
        if (filter === 'pending') return a.status === 'pending';
        if (filter === 'rejected') return a.status === 'rejected';
        return true;
      });

  const tabs: FilterTab[] = ['all', 'shortlisted', 'pending', 'rejected'];

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
            style={{
              background: filter === tab ? 'var(--color-accent)' : 'var(--color-surface)',
              color: filter === tab ? '#fff' : 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Name', 'AI Score', 'Experience', 'Location', 'Status', 'Action'].map(h => (
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
            {filtered.sort((a, b) => b.score - a.score).map(applicant => (
              <tr
                key={applicant.id}
                style={{ borderBottom: '1px solid var(--color-border)' }}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {applicant.name}
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={applicant.score} />
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                  {applicant.experience}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                  {applicant.location}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-medium"
                    style={{ color: STATUS_COLORS[applicant.status] }}
                  >
                    {STATUS_LABELS[applicant.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/recruitment/candidates/${applicant.id}`}
                    className="text-xs no-underline font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No applicants in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
