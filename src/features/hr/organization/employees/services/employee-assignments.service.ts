import {
  employeeAssignmentsApi,
  type CreateEmployeeAssignmentDto,
  type EmployeeAssignmentResponseDto,
  type UpdateEmployeeAssignmentDto,
} from '@/features/hr/organization/employees/lib/api/employee-assignments';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { jobTitlesApi } from '@/features/hr/organization/lib/api/jobTitles';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';

export type EnrichedEmployeeAssignment = EmployeeAssignmentResponseDto & {
  companyNameAr: string;
  branchNameAr: string;
  departmentNameAr: string | null;
  jobTitleNameAr: string | null;
};

const REFERENCE_LIMIT = 200;

export function resolvePrimaryAssignment(
  assignments: EmployeeAssignmentResponseDto[],
): EmployeeAssignmentResponseDto | null {
  const live = assignments.filter((a) => !a.isArchived);
  return (
    live.find((a) => a.isPrimary && a.status === 'active')
    ?? live.find((a) => a.status === 'active')
    ?? live[0]
    ?? null
  );
}

async function loadReferenceMaps(companyIds: string[]) {
  const [companiesRes, ...scopedResults] = await Promise.all([
    companiesApi.getAll({ limit: REFERENCE_LIMIT }),
    ...companyIds.flatMap((companyId) => [
      branchesApi.getAll({ companyId, limit: REFERENCE_LIMIT, ...organizationActiveListStatusQuery() }),
      departmentsApi.getAll({ companyId, limit: REFERENCE_LIMIT, ...organizationActiveListStatusQuery() }),
      jobTitlesApi.getAll({ companyId, limit: REFERENCE_LIMIT, ...organizationActiveListStatusQuery() }),
    ]),
  ]);

  const companyMap = new Map(
    companiesRes.items.map((c) => [c.id, c.nameAr ?? c.nameEn ?? c.code]),
  );

  const branchMap = new Map<string, string>();
  const departmentMap = new Map<string, string>();
  const jobTitleMap = new Map<string, string>();

  for (let i = 0; i < companyIds.length; i += 1) {
    const base = i * 3;
    const branchesRes = scopedResults[base];
    const departmentsRes = scopedResults[base + 1];
    const jobTitlesRes = scopedResults[base + 2];

    branchesRes?.items.forEach((b) => {
      branchMap.set(b.id, b.nameAr ?? b.nameEn ?? b.code);
    });
    departmentsRes?.items.forEach((d) => {
      departmentMap.set(d.id, d.nameAr ?? d.nameEn ?? d.code);
    });
    jobTitlesRes?.items.forEach((j) => {
      jobTitleMap.set(j.id, j.nameAr ?? j.nameEn ?? j.code);
    });
  }

  return { companyMap, branchMap, departmentMap, jobTitleMap };
}

function enrichRows(
  list: EmployeeAssignmentResponseDto[],
  maps: Awaited<ReturnType<typeof loadReferenceMaps>>,
): EnrichedEmployeeAssignment[] {
  const { companyMap, branchMap, departmentMap, jobTitleMap } = maps;
  return list.map((row) => ({
    ...row,
    companyNameAr: companyMap.get(row.companyId) ?? '—',
    branchNameAr: branchMap.get(row.branchId) ?? '—',
    departmentNameAr: row.departmentId ? (departmentMap.get(row.departmentId) ?? '—') : null,
    jobTitleNameAr: row.jobTitleId ? (jobTitleMap.get(row.jobTitleId) ?? '—') : null,
  }));
}

/** Live (non-archived) first, primary pinned, then newest; archived last by archive date. */
export function sortAssignmentHistory(
  items: EnrichedEmployeeAssignment[],
): EnrichedEmployeeAssignment[] {
  return [...items].sort((a, b) => {
    if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
    if (!a.isArchived && !b.isArchived && a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1;
    }
    if (a.isArchived && b.isArchived) {
      const aArch = a.archivedAt ?? a.updatedAt;
      const bArch = b.archivedAt ?? b.updatedAt;
      return bArch.localeCompare(aArch);
    }
    const aKey = a.startDate ?? a.createdAt;
    const bKey = b.startDate ?? b.createdAt;
    return bKey.localeCompare(aKey);
  });
}

export async function loadEmployeeAssignmentsEnriched(
  employeeId: string,
): Promise<EnrichedEmployeeAssignment[]> {
  const raw = await employeeAssignmentsApi.getAll(employeeId);
  const list = Array.isArray(raw) ? raw : [];
  if (list.length === 0) return [];

  const companyIds = [...new Set(list.map((a) => a.companyId))];
  const maps = await loadReferenceMaps(companyIds);
  return sortAssignmentHistory(enrichRows(list, maps));
}

export async function createEmployeeAssignment(
  employeeId: string,
  payload: CreateEmployeeAssignmentDto,
): Promise<EmployeeAssignmentResponseDto> {
  return employeeAssignmentsApi.create(employeeId, payload);
}

export async function updateEmployeeAssignment(
  employeeId: string,
  assignmentId: string,
  payload: UpdateEmployeeAssignmentDto,
): Promise<EmployeeAssignmentResponseDto> {
  return employeeAssignmentsApi.update(employeeId, assignmentId, payload);
}

export async function deleteEmployeeAssignment(
  employeeId: string,
  assignmentId: string,
): Promise<void> {
  await employeeAssignmentsApi.remove(employeeId, assignmentId);
}
