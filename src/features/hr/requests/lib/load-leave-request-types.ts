import { requestTypesApi, type ApiRequestType } from '@/features/hr/requests/lib/api/request-types';

export function isLeaveRequestType(rt: ApiRequestType): boolean {
  if (rt.isActive === false) return false;
  return rt.requestCategory === 'leave' || rt.slug === 'leave-request';
}

export function pickDefaultLeaveRequestTypeId(types: ApiRequestType[]): string {
  const leaveTypes = types.filter(isLeaveRequestType);
  const pool = leaveTypes.length > 0 ? leaveTypes : types;
  return (
    pool.find((t) => t.slug === 'leave-request')?.id ??
    pool.find((t) => t.requestCategory === 'leave')?.id ??
    pool[0]?.id ??
    ''
  );
}

/** Build minimal options from existing leave requests when the catalog list is empty. */
export function leaveRequestTypesFromHistory(
  requests: Array<{ requestTypeId: string; requestTypeNameAr?: string | null }>,
): ApiRequestType[] {
  const byId = new Map<string, ApiRequestType>();
  for (const req of requests) {
    if (!req.requestTypeId || byId.has(req.requestTypeId)) continue;
    byId.set(req.requestTypeId, {
      id: req.requestTypeId,
      companyId: '',
      departmentId: null,
      slug: 'leave-request',
      nameAr: req.requestTypeNameAr?.trim() || 'طلب إجازة',
      nameEn: '',
      requestCategory: 'leave',
      approvalAssignmentTemplateId: null,
      approvalStages: [],
      subtypes: [],
      sortOrder: 0,
      isActive: true,
      notes: '',
      createdAt: '',
      updatedAt: '',
      createdBy: '',
      updatedBy: '',
    });
  }
  return [...byId.values()];
}

export async function loadLeaveRequestTypes(companyId: string): Promise<ApiRequestType[]> {
  if (!companyId) return [];

  try {
    const primary = await requestTypesApi.list({
      companyId,
      requestCategory: 'leave',
      isActive: true,
      limit: 200,
    });
    if (primary.items.length > 0) return primary.items;
  } catch {
    // fall through to broader query
  }

  try {
    const all = await requestTypesApi.list({ companyId, limit: 200 });
    const matched = all.items.filter(isLeaveRequestType);
    return matched.length > 0 ? matched : all.items.filter((rt) => rt.isActive !== false);
  } catch {
    return [];
  }
}
