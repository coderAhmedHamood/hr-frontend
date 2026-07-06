import {
  jobTitlesApi,
  type CreateJobTitleDto,
  type JobTitleResponseDto,
  type UpdateJobTitleDto,
} from '@/features/hr/organization/lib/api/jobTitles';
import {
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';

export type JobTitleTemplateRecord = {
  id: string;
  companyId: string;
  code: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr?: string;
  isActive: boolean;
  notes: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type JobTitlesDirectoryData = {
  templates: JobTitleTemplateRecord[];
  scope: { companyId: string | null; branchId: string | null };
};

function mapTemplate(row: JobTitleResponseDto, index: number): JobTitleTemplateRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    code: row.code,
    titleAr: row.nameAr,
    titleEn: row.nameEn,
    descriptionAr: row.description ?? undefined,
    isActive: row.isActive,
    notes: row.notes,
    sortOrder: index + 1,
    updatedAt: row.updatedAt,
  };
}

export async function loadJobTitlesDirectory(
  companyId?: string | null,
  archiveScope: OrganizationArchiveScope = 'active',
): Promise<JobTitlesDirectoryData> {
  const scopedCompanyId = companyId && companyId !== 'all' ? companyId : undefined;
  const jobs = await jobTitlesApi.getAll({
    ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
    ...organizationListStatusQuery(archiveScope),
    limit: 200,
  });
  return {
    templates: jobs.items.map(mapTemplate),
    scope: {
      companyId: scopedCompanyId ?? jobs.items[0]?.companyId ?? null,
      branchId: null,
    },
  };
}

export async function createJobTitle(payload: CreateJobTitleDto) {
  return jobTitlesApi.create(payload);
}

export async function updateJobTitle(id: string, payload: UpdateJobTitleDto) {
  return jobTitlesApi.update(id, payload);
}

export async function deleteJobTitle(id: string) {
  return jobTitlesApi.remove(id);
}
