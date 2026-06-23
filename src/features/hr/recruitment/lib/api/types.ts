export type RecruitmentJobType = 'full-time' | 'part-time' | 'contract' | 'internship';

export type RecruitmentPipelineStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'technical'
  | 'offer'
  | 'hired'
  | 'rejected';

export type RecruitmentArchiveScope = 'active' | 'archived' | 'all';

export type RecruitmentFormFieldType = 'text' | 'number' | 'select' | 'file';

export type RecruitmentCoreFieldKey = 'applicantName' | 'residencyNumber';

export interface RecruitmentFormField {
  id: string;
  type: RecruitmentFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  sortOrder: number;
  /** System field — rendered separately; not sent inside `answers`. */
  isCore?: boolean;
  /** Maps core field to top-level apply body key. */
  coreKey?: RecruitmentCoreFieldKey;
}

export interface RecruitmentForm {
  id: string;
  jobId: string;
  title: string;
  description: string;
  fields: RecruitmentFormField[];
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentJob {
  id: string;
  title: string;
  slug: string;
  description: string;
  department: string;
  location: string;
  type: RecruitmentJobType;
  isActive: boolean;
  isArchived?: boolean;
  archivedAt?: string | null;
  formId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentJobDetail extends RecruitmentJob {
  form: RecruitmentForm;
}

export interface RecruitmentApplicantScore {
  ruleScore: number;
  aiScore: number;
  finalScore: number;
  reasoning: string;
  scoredAt?: string;
}

export interface RecruitmentApplicant {
  id: string;
  jobId: string;
  formId: string;
  applicantName?: string | null;
  residencyNumber?: string | null;
  answers: Record<string, string | undefined>;
  cvFileName: string | null;
  cvFilePath: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  pipelineStage: RecruitmentPipelineStage;
  score: RecruitmentApplicantScore | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentPipelineStageConfig {
  stage: RecruitmentPipelineStage;
  label: string;
  color: string;
  sortOrder: number;
}

export interface RecruitmentJobStats {
  jobId: string;
  totalApplicants: number;
  hiredCount: number;
  stageCounts: Record<RecruitmentPipelineStage, number>;
}

export interface RecruitmentFormFieldInput {
  id?: string;
  type: RecruitmentFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  sortOrder?: number;
  isCore?: boolean;
  coreKey?: RecruitmentCoreFieldKey;
}

export interface RecruitmentFormInput {
  title: string;
  description?: string;
  fields: RecruitmentFormFieldInput[];
}

export interface CreateRecruitmentJobDto {
  title: string;
  description?: string;
  department: string;
  location?: string;
  type: RecruitmentJobType;
  isActive?: boolean;
  form: RecruitmentFormInput;
}

export interface UpdateRecruitmentJobDto {
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  type?: RecruitmentJobType;
  isActive?: boolean;
  form?: RecruitmentFormInput;
}

export interface UpdateRecruitmentFormDto {
  title?: string;
  description?: string;
  fields?: RecruitmentFormFieldInput[];
}

export interface ListRecruitmentJobsQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  archiveScope?: RecruitmentArchiveScope;
}

export interface ListRecruitmentApplicantsQuery {
  page?: number;
  limit?: number;
  search?: string;
  applicantName?: string;
  residencyNumber?: string;
  cvFileName?: string;
  jobId?: string;
  jobTitle?: string;
  jobDepartment?: string;
  jobLocation?: string;
  pipelineStage?: RecruitmentPipelineStage;
  minScore?: number;
  maxScore?: number;
  submittedFrom?: string;
  submittedTo?: string;
  archiveScope?: RecruitmentArchiveScope;
}

export interface SubmitRecruitmentApplicationDto {
  applicantName: string;
  residencyNumber: string;
  answers: Record<string, string>;
  cvFileName?: string | null;
  cvFileBase64?: string | null;
}

export interface MoveApplicantStageDto {
  pipelineStage: RecruitmentPipelineStage;
}

export interface UpdateRecruitmentPipelineStagesDto {
  stages: RecruitmentPipelineStageConfig[];
}

export interface ListPublicRecruitmentJobsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PublicRecruitmentJob {
  job: RecruitmentJob;
  form: RecruitmentForm;
}

export interface CreateRecruitmentApplicantDto {
  jobId: string;
  applicantName?: string;
  residencyNumber?: string;
  answers: Record<string, string>;
  pipelineStage?: RecruitmentPipelineStage;
  cvFileName?: string | null;
  cvFilePath?: string | null;
}

export interface UpdateRecruitmentApplicantDto {
  applicantName?: string;
  residencyNumber?: string;
  answers?: Record<string, string>;
  pipelineStage?: RecruitmentPipelineStage;
  cvFileName?: string | null;
  cvFilePath?: string | null;
}
