import {
  departmentsApi,
  type CreateDepartmentDto,
  type DepartmentResponseDto,
  type UpdateDepartmentDto,
} from '@/features/hr/organization/lib/api/departments';
import type { OrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { mapDepartmentResponse, type DepartmentRecord } from '@/features/hr/organization/departments/constants/departments-directory';

export type DepartmentsDirectoryData = {
  departments: DepartmentRecord[];
  scope: OrganizationScope;
};

export async function loadDepartmentsDirectory(filters: {
  companyId?: string | null;
  isActive?: boolean;
  /** Pass `null` to load all branches for the company. */
  branchId?: string | null;
}): Promise<DepartmentsDirectoryData> {
  const branchId = filters.branchId && filters.branchId !== 'all' ? filters.branchId : undefined;
  const companyId = filters.companyId && filters.companyId !== 'all' ? filters.companyId : undefined;
  const query: Parameters<typeof departmentsApi.getAll>[0] = {
    ...(companyId ? { companyId } : {}),
    ...(branchId ? { branchId } : {}),
  };
  if (filters.isActive !== undefined) query.isActive = filters.isActive;

  const res = await departmentsApi.getAll({ ...query, limit: 200 });

  return {
    departments: res.items.map(mapDepartmentResponse),
    scope: {
      companyId: companyId ?? res.items[0]?.companyId ?? null,
      branchId: branchId ?? res.items[0]?.branchId ?? null,
    },
  };
}

export async function createDepartment(
  payload: CreateDepartmentDto,
): Promise<DepartmentResponseDto> {
  return departmentsApi.create(payload);
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentDto,
): Promise<DepartmentResponseDto> {
  return departmentsApi.update(id, payload);
}

export async function deleteDepartment(id: string): Promise<void> {
  return departmentsApi.remove(id);
}
