import { requestTypesApi, type ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';

export function isOvertimeRequestType(rt: ApiRequestType): boolean {
  if (rt.isActive === false) return false;
  const category = rt.requestCategory?.trim().toLowerCase();
  if (category === 'overtime') return true;
  return rt.slug?.trim().toLowerCase() === 'overtime-request';
}

export function pickOvertimeRequestType(types: ApiRequestType[]): ApiRequestType | null {
  const pool = types.filter(isOvertimeRequestType);
  return (
    pool.find((t) => t.slug === 'overtime-request') ??
    pool[0] ??
    null
  );
}

export async function loadOvertimeRequestType(companyId: string): Promise<ApiRequestType | null> {
  if (!companyId) return null;
  const active = organizationActiveListStatusQuery();

  try {
    const primary = await requestTypesApi.list({
      companyId,
      requestCategory: 'overtime',
      isActive: true,
      limit: 50,
      ...active,
    });
    const picked = pickOvertimeRequestType(primary.items);
    if (picked) return picked;
  } catch {
    // fall through
  }

  try {
    const all = await requestTypesApi.list({ companyId, limit: 200, ...active });
    return pickOvertimeRequestType(all.items);
  } catch {
    return null;
  }
}

export const OVERTIME_REQUEST_TYPE_MISSING_MESSAGE =
  'لا يوجد نوع طلب «عمل إضافي» مفعّل لهذه الشركة (الرمز الرسمي: overtime-request، الفئة: overtime). ' +
  'يُنشأ عادةً مع تهيئة HR للشركة؛ راجع «أنواع الطلبات» أو شغّل تهيئة catalog الأنواع الرسمية، ثم أعد المحاولة.';
