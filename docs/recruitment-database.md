# recruitment

```sql
CREATE TYPE recruitment_job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');

CREATE TYPE recruitment_pipeline_stage AS ENUM (
  'applied',
  'screening',
  'interview',
  'technical',
  'offer',
  'hired',
  'rejected'
);

CREATE TYPE recruitment_form_field_type AS ENUM ('text', 'number', 'select', 'file');

CREATE TYPE recruitment_ats_role AS ENUM ('admin', 'recruiter', 'viewer');

CREATE TABLE recruitment_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recruitment_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES recruitment_tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role recruitment_ats_role NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE recruitment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES recruitment_tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  type recruitment_job_type NOT NULL DEFAULT 'full-time',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE recruitment_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES recruitment_tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL UNIQUE REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recruitment_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES recruitment_forms(id) ON DELETE CASCADE,
  type recruitment_form_field_type NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recruitment_form_field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES recruitment_form_fields(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE recruitment_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES recruitment_tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES recruitment_forms(id) ON DELETE CASCADE,
  pipeline_stage recruitment_pipeline_stage NOT NULL DEFAULT 'applied',
  cv_file_name TEXT NULL,
  cv_file_path TEXT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recruitment_applicant_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES recruitment_applicants(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES recruitment_form_fields(id) ON DELETE CASCADE,
  value TEXT NULL,
  UNIQUE (applicant_id, field_id)
);

CREATE TABLE recruitment_applicant_scores (
  applicant_id UUID PRIMARY KEY REFERENCES recruitment_applicants(id) ON DELETE CASCADE,
  rule_score NUMERIC(5,2) NOT NULL,
  ai_score NUMERIC(5,2) NOT NULL,
  final_score NUMERIC(5,2) NOT NULL,
  reasoning TEXT NOT NULL DEFAULT '',
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recruitment_pipeline_stage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES recruitment_tenants(id) ON DELETE CASCADE,
  stage recruitment_pipeline_stage NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, stage)
);

CREATE INDEX idx_recruitment_jobs_tenant ON recruitment_jobs(tenant_id);
CREATE INDEX idx_recruitment_jobs_active ON recruitment_jobs(tenant_id, is_active);
CREATE INDEX idx_recruitment_applicants_job ON recruitment_applicants(job_id);
CREATE INDEX idx_recruitment_applicants_stage ON recruitment_applicants(job_id, pipeline_stage);
CREATE INDEX idx_recruitment_applicants_submitted ON recruitment_applicants(submitted_at DESC);
CREATE INDEX idx_recruitment_form_fields_form ON recruitment_form_fields(form_id, sort_order);
```

```typescript
type RecruitmentJobType = 'full-time' | 'part-time' | 'contract' | 'internship';
type RecruitmentPipelineStage = 'applied' | 'screening' | 'interview' | 'technical' | 'offer' | 'hired' | 'rejected';
type RecruitmentFormFieldType = 'text' | 'number' | 'select' | 'file';
type RecruitmentAtsRole = 'admin' | 'recruiter' | 'viewer';

interface RecruitmentTenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: string;
}

interface RecruitmentUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: RecruitmentAtsRole;
  createdAt: string;
}

interface RecruitmentFormField {
  id: string;
  type: RecruitmentFormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  sortOrder: number;
}

interface RecruitmentForm {
  id: string;
  tenantId: string;
  jobId: string;
  title: string;
  description: string;
  fields: RecruitmentFormField[];
  createdAt: string;
  updatedAt: string;
}

interface RecruitmentJob {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  department: string;
  location: string;
  type: RecruitmentJobType;
  isActive: boolean;
  formId: string;
  createdAt: string;
  updatedAt: string;
}

interface RecruitmentApplicantScore {
  ruleScore: number;
  aiScore: number;
  finalScore: number;
  reasoning: string;
}

interface RecruitmentApplicant {
  id: string;
  tenantId: string;
  jobId: string;
  formId: string;
  answers: Record<string, string | undefined>;
  cvFileName: string | null;
  cvFilePath: string | null;
  pipelineStage: RecruitmentPipelineStage;
  score: RecruitmentApplicantScore | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface RecruitmentPipelineStageConfig {
  stage: RecruitmentPipelineStage;
  label: string;
  color: string;
  sortOrder: number;
}

interface CreateRecruitmentJobDto {
  tenantId: string;
  title: string;
  description: string;
  department: string;
  location: string;
  type: RecruitmentJobType;
  isActive?: boolean;
  form: {
    title: string;
    description: string;
    fields: Array<{
      type: RecruitmentFormFieldType;
      label: string;
      required: boolean;
      options?: string[];
      sortOrder?: number;
    }>;
  };
}

interface UpdateRecruitmentJobDto {
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  type?: RecruitmentJobType;
  isActive?: boolean;
  form?: {
    title?: string;
    description?: string;
    fields?: Array<{
      id?: string;
      type: RecruitmentFormFieldType;
      label: string;
      required: boolean;
      options?: string[];
      sortOrder?: number;
    }>;
  };
}

interface ListRecruitmentJobsQuery {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface ListRecruitmentApplicantsQuery {
  tenantId: string;
  jobId?: string;
  pipelineStage?: RecruitmentPipelineStage | 'all';
  minScore?: number;
  search?: string;
  page?: number;
  limit?: number;
}

interface SubmitRecruitmentApplicationDto {
  answers: Record<string, string>;
  cvFileName?: string | null;
  cvFileBase64?: string | null;
}

interface MoveApplicantStageDto {
  pipelineStage: RecruitmentPipelineStage;
}

interface RecruitmentJobStats {
  jobId: string;
  totalApplicants: number;
  hiredCount: number;
  stageCounts: Record<RecruitmentPipelineStage, number>;
}
```

```http
GET    /recruitment/jobs
GET    /recruitment/jobs/:id
GET    /recruitment/jobs/by-slug/:slug
POST   /recruitment/jobs
PATCH  /recruitment/jobs/:id
DELETE /recruitment/jobs/:id
PATCH  /recruitment/jobs/:id/toggle-active

GET    /recruitment/jobs/:jobId/form
PATCH  /recruitment/jobs/:jobId/form

GET    /recruitment/applicants
GET    /recruitment/applicants/:id
POST   /recruitment/applicants/:id/score
PATCH  /recruitment/applicants/:id/stage
DELETE /recruitment/applicants/:id

GET    /recruitment/jobs/:jobId/applicants
GET    /recruitment/jobs/:jobId/stats
GET    /recruitment/jobs/:jobId/pipeline

GET    /public/recruitment/jobs/:slug
POST   /public/recruitment/jobs/:slug/apply

GET    /recruitment/pipeline-stages
PUT    /recruitment/pipeline-stages
```

```typescript
recruitmentApi.listJobs(query: ListRecruitmentJobsQuery): Promise<PaginatedResult<RecruitmentJob>>;
recruitmentApi.getJob(id: string): Promise<RecruitmentJob>;
recruitmentApi.getJobBySlug(slug: string): Promise<RecruitmentJob>;
recruitmentApi.createJob(dto: CreateRecruitmentJobDto): Promise<RecruitmentJob>;
recruitmentApi.updateJob(id: string, dto: UpdateRecruitmentJobDto): Promise<RecruitmentJob>;
recruitmentApi.deleteJob(id: string): Promise<void>;
recruitmentApi.toggleJobActive(id: string): Promise<RecruitmentJob>;

recruitmentApi.getFormByJobId(jobId: string): Promise<RecruitmentForm>;
recruitmentApi.updateFormByJobId(jobId: string, dto: UpdateRecruitmentJobDto['form']): Promise<RecruitmentForm>;

recruitmentApi.listApplicants(query: ListRecruitmentApplicantsQuery): Promise<PaginatedResult<RecruitmentApplicant>>;
recruitmentApi.getApplicant(id: string): Promise<RecruitmentApplicant>;
recruitmentApi.deleteApplicant(id: string): Promise<void>;
recruitmentApi.moveApplicantStage(id: string, dto: MoveApplicantStageDto): Promise<RecruitmentApplicant>;
recruitmentApi.scoreApplicant(id: string): Promise<RecruitmentApplicantScore>;

recruitmentApi.getJobApplicants(jobId: string): Promise<RecruitmentApplicant[]>;
recruitmentApi.getJobStats(jobId: string): Promise<RecruitmentJobStats>;
recruitmentApi.getJobPipeline(jobId: string): Promise<Record<RecruitmentPipelineStage, RecruitmentApplicant[]>>;

publicRecruitmentApi.getPublicJob(slug: string): Promise<{ job: RecruitmentJob; form: RecruitmentForm }>;
publicRecruitmentApi.submitApplication(slug: string, dto: SubmitRecruitmentApplicationDto): Promise<RecruitmentApplicant>;

recruitmentApi.listPipelineStages(tenantId: string): Promise<RecruitmentPipelineStageConfig[]>;
recruitmentApi.updatePipelineStages(tenantId: string, stages: RecruitmentPipelineStageConfig[]): Promise<RecruitmentPipelineStageConfig[]>;
```

```sql
CREATE OR REPLACE FUNCTION recruitment_move_applicant_stage(
  p_applicant_id UUID,
  p_stage recruitment_pipeline_stage
) RETURNS recruitment_applicants AS $$
DECLARE v_row recruitment_applicants;
BEGIN
  UPDATE recruitment_applicants
  SET pipeline_stage = p_stage, updated_at = now()
  WHERE id = p_applicant_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recruitment_job_applicant_counts(p_job_id UUID)
RETURNS TABLE(stage recruitment_pipeline_stage, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT a.pipeline_stage, COUNT(*)::BIGINT
  FROM recruitment_applicants a
  WHERE a.job_id = p_job_id
  GROUP BY a.pipeline_stage;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recruitment_score_applicant(p_applicant_id UUID)
RETURNS recruitment_applicant_scores AS $$
DECLARE
  v_score recruitment_applicant_scores;
BEGIN
  DELETE FROM recruitment_applicant_scores WHERE applicant_id = p_applicant_id;
  INSERT INTO recruitment_applicant_scores (applicant_id, rule_score, ai_score, final_score, reasoning)
  VALUES (p_applicant_id, 0, 0, 0, '')
  RETURNING * INTO v_score;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;
```
