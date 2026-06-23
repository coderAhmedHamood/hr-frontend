import {
  leaveTypesApi,
  type LeaveTypeListQuery,
  type LeaveTypeResponseDto,
} from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import {
  organizationActiveListArchiveQuery,
  organizationListArchiveQuery,
} from '@/features/hr/organization/lib/archive-scope';

export function filterActiveLeaveTypes(types: LeaveTypeResponseDto[]): LeaveTypeResponseDto[] {
  return types.filter((t) => t.isActive);
}

/** Prefer annual catalog row; otherwise first active type that deducts from balance. */
export function resolveDefaultLeaveTypeId(types: LeaveTypeResponseDto[]): string | null {
  const active = filterActiveLeaveTypes(types);
  return (
    active.find((t) => t.code === 'annual')?.id
    ?? active.find((t) => t.deductsFromBalance)?.id
    ?? active[0]?.id
    ?? null
  );
}

export function findLeaveTypeById(
  types: LeaveTypeResponseDto[],
  leaveTypeId: string | null | undefined,
): LeaveTypeResponseDto | undefined {
  if (!leaveTypeId) return undefined;
  return types.find((t) => t.id === leaveTypeId);
}

export function leaveTypeNameAr(
  types: LeaveTypeResponseDto[],
  leaveTypeId: string | null | undefined,
): string {
  return findLeaveTypeById(types, leaveTypeId)?.nameAr ?? '—';
}

export async function loadCompanyLeaveTypes(query: LeaveTypeListQuery = { limit: 200 }) {
  const { isActive: wantActiveOnly, archiveScope, ...rest } = query;
  const res = await leaveTypesApi.getAll({
    ...rest,
    ...(archiveScope ? organizationListArchiveQuery(archiveScope) : organizationActiveListArchiveQuery()),
  });
  const items = wantActiveOnly === false ? res.items : filterActiveLeaveTypes(res.items);
  return {
    items,
    defaultLeaveTypeId: resolveDefaultLeaveTypeId(items),
    pagination: res.pagination,
  };
}
