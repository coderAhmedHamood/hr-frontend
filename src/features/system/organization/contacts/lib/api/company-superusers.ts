import { apiRequest } from '@/features/hr/lib/api/client';

export type CompanySuperuserRecord = {
  id: string;
  companyId: string;
  userId: string;
  isActive: boolean;
};

function asSuperuserList(value: unknown): CompanySuperuserRecord[] {
  if (Array.isArray(value)) return value as CompanySuperuserRecord[];
  if (value && typeof value === 'object') {
    const record = value as { items?: unknown; data?: unknown };
    if (Array.isArray(record.items)) return record.items as CompanySuperuserRecord[];
    if (Array.isArray(record.data)) return record.data as CompanySuperuserRecord[];
  }
  return [];
}

export const companySuperusersApi = {
  list(companyId: string) {
    return apiRequest<unknown>(`/companies/${companyId}/superusers`).then(asSuperuserList);
  },
  assign(companyId: string, userId: string) {
    return apiRequest<unknown>(`/companies/${companyId}/superusers`, {
      method: 'POST',
      body: { userId },
    });
  },
  setActive(companyId: string, userId: string, isActive: boolean) {
    return apiRequest<unknown>(`/companies/${companyId}/superusers/${userId}`, {
      method: 'PATCH',
      body: { isActive },
    });
  },
};
