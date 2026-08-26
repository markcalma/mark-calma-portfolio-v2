import { Sidebar } from '@/components/layout/Sidebar';
import { ActivityFeed } from '@/components/layout/ActivityFeed';
import activityData from '@/data/fixtures/recruitment/activity.json';
import { ActivityEntry } from '@/types/recruitment';

const activity = activityData as ActivityEntry[];

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <ActivityFeed entries={activity} />
    </div>
  );
}
