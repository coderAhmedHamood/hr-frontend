/** مسارات التوظيف مع دعم السياق حسب الوظيفة */
export function recruitmentJobRoutes(jobId: string, slug?: string) {
  const jobQuery = `jobId=${encodeURIComponent(jobId)}`;
  return {
    hub: `/hr/recruitment/ats-admin/jobs/${jobId}`,
    applicants: `/hr/recruitment/ats-applicants?${jobQuery}`,
    pipeline: `/hr/recruitment/ats-pipeline?${jobQuery}`,
    editForm: `/hr/recruitment/ats-admin/jobs/create?edit=${encodeURIComponent(jobId)}`,
    publicApply: slug ? `/f/${slug}` : undefined,
    applicantDetail: (applicantId: string) =>
      `/hr/recruitment/ats-applicants?${jobQuery}&detail=${encodeURIComponent(applicantId)}`,
  };
}

export const recruitmentGlobalRoutes = {
  careers: '/careers',
  jobs: '/hr/recruitment/ats-admin',
  applicants: '/hr/recruitment/ats-applicants',
  pipeline: '/hr/recruitment/ats-pipeline',
  createJob: '/hr/recruitment/ats-admin/jobs/create',
} as const;
