import type { AtsApplicant, AtsForm, AtsJob } from '@/features/hr/recruitment/lib/ats/types';
import type {
  RecruitmentApplicant,
  RecruitmentForm,
  RecruitmentJob,
  RecruitmentJobDetail,
} from '@/features/hr/recruitment/lib/api/types';

export function mapRecruitmentJob(job: RecruitmentJob): AtsJob {
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    description: job.description,
    department: job.department,
    location: job.location,
    type: job.type,
    isActive: job.isActive,
    isArchived: job.isArchived,
    archivedAt: job.archivedAt ?? null,
    formId: job.formId,
    createdAt: job.createdAt,
  };
}

export function mapRecruitmentForm(form: RecruitmentForm): AtsForm {
  return {
    id: form.id,
    jobId: form.jobId,
    title: form.title,
    description: form.description,
    fields: (form.fields ?? []).map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      required: f.required,
      options: f.options,
      sortOrder: f.sortOrder,
      isCore: f.isCore,
      coreKey: f.coreKey,
    })),
    createdAt: form.createdAt,
  };
}

export function mapRecruitmentApplicant(applicant: RecruitmentApplicant): AtsApplicant {
  return {
    id: applicant.id,
    jobId: applicant.jobId,
    formId: applicant.formId,
    applicantName: applicant.applicantName,
    residencyNumber: applicant.residencyNumber,
    answers: applicant.answers,
    cvFileName: applicant.cvFileName,
    cvFileData: applicant.cvFilePath,
    isArchived: applicant.isArchived,
    archivedAt: applicant.archivedAt ?? null,
    pipelineStage: applicant.pipelineStage,
    score: applicant.score
      ? {
          ruleScore: applicant.score.ruleScore,
          aiScore: applicant.score.aiScore,
          finalScore: applicant.score.finalScore,
          reasoning: applicant.score.reasoning,
        }
      : null,
    submittedAt: applicant.submittedAt,
  };
}

export function mapRecruitmentJobDetail(detail: RecruitmentJobDetail) {
  return {
    job: mapRecruitmentJob(detail),
    form: detail.form ? mapRecruitmentForm(detail.form) : null,
  };
}
