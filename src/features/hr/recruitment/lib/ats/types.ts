export type AtsRole = 'admin' | 'recruiter' | 'viewer';

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

export interface AtsTenant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  createdAt: string;
}

export interface AtsUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: AtsRole;
  createdAt: string;
}

export interface AtsFormField {
  id: string;
  type: AtsFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface AtsForm {
  id: string;
  tenantId: string;
  jobId: string;
  title: string;
  description: string;
  fields: AtsFormField[];
  createdAt: string;
}

export interface AtsJob {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  department: string;
  location: string;
  type: AtsJobType;
  isActive: boolean;
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
  tenantId: string;
  jobId: string;
  formId: string;
  answers: Record<string, string | undefined>;
  cvFileName?: string | null;
  cvFileData?: string | null;
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

export interface AtsData {
  tenants: AtsTenant[];
  users: AtsUser[];
  jobs: AtsJob[];
  forms: AtsForm[];
  applicants: AtsApplicant[];
  pipelineConfig: AtsPipelineConfig;
}
