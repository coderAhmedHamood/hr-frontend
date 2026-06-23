import { JobHubClient } from '@/features/hr/recruitment/ats/components/job-hub-client';

export default async function JobHubPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <JobHubClient jobId={jobId} />;
}
