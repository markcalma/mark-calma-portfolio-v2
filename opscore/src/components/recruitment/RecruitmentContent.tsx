'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { JobTable } from '@/components/recruitment/JobTable';
import { ActivityFeed } from '@/components/layout/ActivityFeed';
import { Job, ActivityEntry } from '@/types/recruitment';

interface Props {
  initialJobs: Job[];
  initialActivity: ActivityEntry[];
}

export function RecruitmentContent({ initialJobs, initialActivity }: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [activity, setActivity] = useState<ActivityEntry[]>(initialActivity);

  useEffect(() => {
    const channel = supabase
      .channel('recruitment-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs' },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const updated: Job = {
            id: r.id as string,
            role: r.role as string,
            client: r.client as string,
            applicantCount: r.applicant_count as number,
            screened: r.screened as number,
            topCandidates: r.top_candidates as number,
            status: r.status as Job['status'],
          };
          setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          if (!r.job_id) return;
          const entry: ActivityEntry = {
            id: r.id as string,
            message: r.message as string,
            timestamp: r.timestamp as string,
          };
          setActivity(prev => [entry, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const metrics = [
    { label: "Open Positions", value: jobs.filter(j => j.status !== 'filled').length, change: "Active roles" },
    { label: "Total Applicants", value: jobs.reduce((sum, j) => sum + j.applicantCount, 0), change: "Across all roles" },
    { label: "AI Screened", value: jobs.reduce((sum, j) => sum + j.screened, 0), change: "Processed today" },
    { label: "Interviewing", value: jobs.filter(j => j.status === 'interviewing').length, change: "In progress" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 24 }}>
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-card shadow-sm" style={{ padding: 32 }}>
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{m.label}</p>
            <p className="text-3xl font-semibold text-foreground" style={{ marginTop: 12 }}>{m.value}</p>
            <p className="text-xs text-muted-foreground" style={{ marginTop: 8 }}>{m.change}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        <div className="rounded-xl bg-card shadow-sm overflow-hidden" style={{ flex: 1 }}>
          <div className="flex items-center justify-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold text-foreground">Job Pipeline</p>
            <p className="text-xs text-muted-foreground">{jobs.length} roles</p>
          </div>
          <div className="overflow-y-auto">
            <JobTable jobs={jobs} />
          </div>
        </div>

        <div className="rounded-xl bg-card shadow-sm overflow-hidden" style={{ width: 280, flexShrink: 0 }}>
          <ActivityFeed entries={activity} />
        </div>
      </div>
    </>
  );
}
