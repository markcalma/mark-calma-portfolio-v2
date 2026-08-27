import { Header } from '@/components/layout/Header';
import { JobTable } from '@/components/recruitment/JobTable';
import jobsData from '@/data/fixtures/recruitment/jobs.json';
import { Job } from '@/types/recruitment';

const jobs = jobsData as Job[];

const totalApplicants = jobs.reduce((sum, j) => sum + j.applicantCount, 0);
const totalScreened = jobs.reduce((sum, j) => sum + j.screened, 0);
const interviewsScheduled = jobs.filter(j => j.status === 'interviewing').length;

export default function RecruitmentPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Job Pipeline - Apex Staffing Co."
        stats={[
          { label: 'Open Positions', value: jobs.filter(j => j.status !== 'filled').length },
          { label: 'Total Applicants', value: totalApplicants },
          { label: 'AI Screened Today', value: totalScreened },
          { label: 'Interviewing', value: interviewsScheduled },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <JobTable jobs={jobs} />
      </div>
    </div>
  );
}
