export type JobStatus = 'new' | 'screening' | 'interviewing' | 'filled';

export interface Job {
  id: string;
  role: string;
  client: string;
  applicantCount: number;
  screened: number;
  topCandidates: number;
  status: JobStatus;
}

export type ApplicantStatus = 'shortlisted' | 'pending' | 'rejected' | 'questions-sent' | 'interview-scheduled';

export interface Applicant {
  id: string;
  jobId: string;
  name: string;
  score: number;
  experience: string;
  location: string;
  status: ApplicantStatus;
  aiSummary: string;
  recommendation: 'advance' | 'request-info' | 'reject';
  skills: { label: string; match: number }[];
  highlights: string[];
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  message: string;
}
