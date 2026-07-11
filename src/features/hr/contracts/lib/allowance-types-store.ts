import { create } from 'zustand';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { payrollListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import { allowanceTypesApi, type AllowanceTypeDto } from './api/allowance-types';
import { ApiError } from '@/features/hr/lib/api/client';

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
  loadedCompanyId: string | null;
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: () => Promise<void>;
  add: (data: Omit<HRAllowanceTypeRecord, 'id' | 'updatedAt'>) => Promise<string>;
  update: (id: string, patch: Partial<Omit<HRAllowanceTypeRecord, 'id' | 'updatedAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

let allowanceTypesFetchPromise: Promise<void> | null = null;

export const useHRAllowanceTypesStore = create<State>()((set, get) => ({
  items: [],
  loadedCompanyId: null,
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;

    const { loadedCompanyId, isLoading } = get();
    if (loadedCompanyId === companyId) return;
    if (isLoading && allowanceTypesFetchPromise) return allowanceTypesFetchPromise;

    allowanceTypesFetchPromise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await allowanceTypesApi.getAll({ companyId, limit: 200, ...payrollListArchiveQuery() });
        set({ items: result.items.map(mapApi), loadedCompanyId: companyId, isLoading: false });
      } catch (e) {
        set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false, loadedCompanyId: null });
      } finally {
        allowanceTypesFetchPromise = null;
      }
    })();

    return allowanceTypesFetchPromise;
  },

  add: async (data) => {
    const companyId = getDefaultCompanyId() ?? '';
    const created = await allowanceTypesApi.create({
      companyId,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      calculationType: 'fixed_amount',
      typicalAmount: data.typicalAmount,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    });
    const mapped = mapApi(created);
    set(s => ({ items: [...s.items, mapped] }));
    return mapped.id;
  },

  update: async (id, patch) => {
    const updated = await allowanceTypesApi.update(id, {
      nameAr: patch.nameAr,
      nameEn: patch.nameEn,
      typicalAmount: patch.typicalAmount,
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
