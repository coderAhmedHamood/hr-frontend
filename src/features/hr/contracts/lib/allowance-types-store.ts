import { create } from 'zustand';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { payrollListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import { allowanceTypesApi, type AllowanceTypeDto } from './api/allowance-types';

export type HRAllowanceTypeRecord = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  typicalAmount: number;
  currency: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

function mapApi(r: AllowanceTypeDto): HRAllowanceTypeRecord {
  return {
    id: r.id,
    code: r.code,
    nameAr: r.nameAr,
    nameEn: r.nameEn ?? '',
    typicalAmount: parseFloat(r.typicalAmount ?? '0') || 0,
    currency: r.currency,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    updatedAt: r.updatedAt,
  };
}

interface State {
  items: HRAllowanceTypeRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Omit<HRAllowanceTypeRecord, 'id' | 'updatedAt'>) => Promise<string>;
  update: (id: string, patch: Partial<Omit<HRAllowanceTypeRecord, 'id' | 'updatedAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHRAllowanceTypesStore = create<State>()((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await allowanceTypesApi.getAll({ companyId, limit: 200, ...payrollListArchiveQuery() });
      set({ items: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (data) => {
    const companyId = getDefaultCompanyId() ?? '';
    const created = await allowanceTypesApi.create({
      companyId,
      code: data.code,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      calculationType: 'fixed_amount',
      typicalAmount: data.typicalAmount,
      currency: data.currency,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    });
    const mapped = mapApi(created);
    set(s => ({ items: [...s.items, mapped] }));
    return mapped.id;
  },

  update: async (id, patch) => {
    const updated = await allowanceTypesApi.update(id, {
      code: patch.code,
      nameAr: patch.nameAr,
      nameEn: patch.nameEn,
      typicalAmount: patch.typicalAmount,
      currency: patch.currency,
      sortOrder: patch.sortOrder,
      isActive: patch.isActive,
    });
    set(s => ({ items: s.items.map(row => row.id === id ? mapApi(updated) : row) }));
  },

  remove: async (id) => {
    await allowanceTypesApi.remove(id);
    set(s => ({ items: s.items.filter(row => row.id !== id) }));
  },
}));
