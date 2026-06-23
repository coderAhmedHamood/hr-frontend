export type AtsJobType = 'full-time' | 'part-time' | 'contract' | 'internship';

export type AtsPipelineStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'technical'
  | 'offer'
  | 'hired'
  | 'rejected';

export type AtsFormFieldType = 'text' | 'number' | 'select' | 'file';

export type AtsCoreFieldKey = 'applicantName' | 'residencyNumber';

export interface AtsFormField {
  id: string;
  type: AtsFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  sortOrder?: number;
  isCore?: boolean;
  coreKey?: AtsCoreFieldKey;
}

export interface AtsForm {
  id: string;
  jobId: string;
  title: string;
  description: string;
  fields: AtsFormField[];
  createdAt: string;
}

export interface AtsJob {
  id: string;
  title: string;
  slug: string;
  description: string;
  department: string;
  location: string;
  type: AtsJobType;
  isActive: boolean;
  isArchived?: boolean;
  archivedAt?: string | null;
  formId: string;
  createdAt: string;
}

export interface AtsApplicantScore {
  ruleScore: number;
  aiScore: number;
  finalScore: number;
  reasoning: string;
}

export interface AtsApplicant {
  id: string;
  jobId: string;
  formId: string;
  applicantName?: string | null;
  residencyNumber?: string | null;
  answers: Record<string, string | undefined>;
  cvFileName?: string | null;
  cvFileData?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  pipelineStage: AtsPipelineStage;
  score?: AtsApplicantScore | null;
  submittedAt: string;
}

export interface AtsPipelineStageConfig {
  id: AtsPipelineStage;
  label: string;
  color: string;
}

export interface AtsPipelineConfig {
  stages: AtsPipelineStageConfig[];
}
