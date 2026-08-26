'use client';

import { Applicant } from '@/types/recruitment';
import { ScoreBadge } from './ScoreBadge';

interface CandidateDetailProps {
  applicant: Applicant;
  roleName: string;
}

const RECOMMENDATION_STYLES = {
  advance: { label: 'Advance to Interview', color: 'var(--color-success)', bg: 'rgba(34,197,94,0.1)' },
  'request-info': { label: 'Request More Info', color: 'var(--color-warning)', bg: 'rgba(234,179,8,0.1)' },
  reject: { label: 'Reject', color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.1)' },
};

export function CandidateDetail({ applicant, roleName }: CandidateDetailProps) {
  const rec = RECOMMENDATION_STYLES[applicant.recommendation];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {applicant.name}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Applying for {roleName} - {applicant.location} - {applicant.experience} experience
          </p>
        </div>
        <ScoreBadge score={applicant.score} size="md" />
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
          AI Summary
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          {applicant.aiSummary}
        </p>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Skills Match
        </p>
        <div className="space-y-3">
          {applicant.skills.map(skill => (
            <div key={skill.label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--color-text-primary)' }}>{skill.label}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{skill.match}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${skill.match}%`,
                    background: skill.match >= 80 ? 'var(--color-success)' : skill.match >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Resume Highlights
        </p>
        <ul className="space-y-2">
          {applicant.highlights.map((h, i) => (
            <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
              <span style={{ color: 'var(--color-accent)' }}>-</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: rec.bg, border: `1px solid ${rec.color}44` }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            AI Recommendation
          </p>
          <p className="text-sm font-semibold" style={{ color: rec.color }}>
            {rec.label}
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
          style={{ background: rec.color, color: '#fff' }}
          onClick={() => alert('Action triggered - n8n webhook would fire here')}
        >
          {rec.label}
        </button>
      </div>
    </div>
  );
}
