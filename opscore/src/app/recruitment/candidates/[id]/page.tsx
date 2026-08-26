import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { CandidateDetail } from '@/components/recruitment/CandidateDetail';
import jobsData from '@/data/fixtures/recruitment/jobs.json';
import applicantsData from '@/data/fixtures/recruitment/applicants.json';
import { Job, Applicant } from '@/types/recruitment';

const jobs = jobsData as Job[];
const allApplicants = applicantsData as Applicant[];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetailPage({ params }: Props) {
  const { id } = await params;
  const applicant = allApplicants.find(a => a.id === id);
  if (!applicant) notFound();

  const job = jobs.find(j => j.id === applicant.jobId);
  if (!job) notFound();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={`${applicant.name} - Candidate Profile`}
        stats={[
          { label: 'Role', value: job.role },
          { label: 'Client', value: job.client },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <Link
            href={`/recruitment/applicants/${applicant.jobId}`}
            className="text-xs no-underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ← Back to Applicants
          </Link>
        </div>
        <CandidateDetail applicant={applicant} roleName={job.role} />
      </div>
    </div>
  );
}
