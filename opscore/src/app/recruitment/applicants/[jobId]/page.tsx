import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ApplicantTable } from '@/components/recruitment/ApplicantTable';
import jobsData from '@/data/fixtures/recruitment/jobs.json';
import applicantsData from '@/data/fixtures/recruitment/applicants.json';
import { Job, Applicant } from '@/types/recruitment';

const jobs = jobsData as Job[];
const allApplicants = applicantsData as Applicant[];

interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function ApplicantInboxPage({ params }: Props) {
  const { jobId } = await params;
  const job = jobs.find(j => j.id === jobId);
  if (!job) notFound();

  const applicants = allApplicants.filter(a => a.jobId === jobId);
  const shortlisted = applicants.filter(a =>
    ['shortlisted', 'questions-sent', 'interview-scheduled'].includes(a.status)
  ).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title={`${job.role} - ${job.client}`}
        stats={[
          { label: 'Total Applicants', value: job.applicantCount },
          { label: 'AI Screened', value: job.screened },
          { label: 'Shortlisted', value: shortlisted },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <Link
            href="/recruitment"
            className="text-xs no-underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            &larr; Back to Job Pipeline
          </Link>
        </div>
        <ApplicantTable applicants={applicants} jobId={jobId} />
        {applicants.length === 0 && (
          <p className="text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
            No applicants found for this role in the demo dataset.
          </p>
        )}
      </div>
    </div>
  );
}
