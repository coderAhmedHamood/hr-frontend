import {
  branchesApi,
  type CreateBranchDto,
  type UpdateBranchDto,
} from '@/features/hr/organization/lib/api/branches';
import type { OrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import {
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import { mapBranchResponse, type BranchRow } from '@/features/hr/organization/branches/constants/branches-directory';

export type BranchesDirectoryData = {
  branches: BranchRow[];
  scope: OrganizationScope;
};

export async function loadBranchesDirectory(
  companyId?: string | null,
  archiveScope: OrganizationArchiveScope = 'active',
): Promise<BranchesDirectoryData> {
  const res = await branchesApi.getAll({
    ...(companyId && companyId !== 'all' ? { companyId } : {}),
    ...organizationListStatusQuery(archiveScope),
    limit: 200,
  });
  return {
    branches: res.items.map(mapBranchResponse),
    scope: {
      companyId: companyId && companyId !== 'all' ? companyId : null,
      branchId: null,
    },
  };
}

export async function createBranch(payload: CreateBranchDto) {
  return branchesApi.create(payload);
}

export async function updateBranch(id: string, payload: UpdateBranchDto) {
  return branchesApi.update(id, payload);
}

export async function deleteBranch(id: string) {
  return branchesApi.remove(id);
}
