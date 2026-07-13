import {
  leaveTypesApi,
  type CreateLeaveTypeDto,
  type LeaveTypeResponseDto,
  type UpdateLeaveTypeDto,
} from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import { loadCompanyLeaveTypes } from '@/features/hr/leaves/lib/leave-types-utils';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { HRLeaveTypeRecord } from '@/features/hr/leaves/leave-types/types';
import { toIso } from '@/features/hr/lib/map-dto';

export function mapLeaveTypeResponse(dto: LeaveTypeResponseDto): HRLeaveTypeRecord {
  return {
    id: dto.id,
    code: dto.code,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? dto.nameAr,
    paid: dto.paid,
    deductsFromBalance: dto.deductsFromBalance,
    requiresApproval: dto.requiresApproval,
    maxDaysPerRequest: dto.maxDaysPerRequest,
    sortOrder: dto.sortOrder,
    isActive: dto.isActive,
    isSystem: dto.isSystem === true,
    updatedAt: toIso(dto.updatedAt),
  };
}

export async function loadLeaveTypes(companyId?: string | null) {
  const scope = await resolveOrganizationScope(companyId ? { companyId } : undefined);
  const res = await loadCompanyLeaveTypes(
    scope.companyId ? { companyId: scope.companyId, limit: 200, isActive: true } : { limit: 200, isActive: true },
  );
  return {
    items: res.items.map(mapLeaveTypeResponse),
    companyId: scope.companyId ?? res.items[0]?.companyId ?? null,
  };
}

export async function createLeaveType(payload: CreateLeaveTypeDto) {
  return leaveTypesApi.create(payload);
}

export async function updateLeaveType(id: string, payload: UpdateLeaveTypeDto) {
  return leaveTypesApi.update(id, payload);
}

export async function deleteLeaveType(id: string) {
  return leaveTypesApi.remove(id);
}
