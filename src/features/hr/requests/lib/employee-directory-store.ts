export type { HREmployeeStatus, HREmployeeHierarchyRole, HREmployeeDirectoryRow, HREmployeeDirectoryEntry } from '@/features/hr/requests/types/employee-directory';

import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { employeesApi, type EmployeeResponseDto } from './api/employees';
import { ApiError } from '@/features/hr/lib/api/client';
import type { HREmployeeDirectoryRow, HREmployeeStatus } from '@/features/hr/requests/types/employee-directory';

// ─── Types ────────────────────────────────────────────────────────────────────



// kept for backward compatibility with existing imports

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapApi(e: EmployeeResponseDto): HREmployeeDirectoryRow {
  const status: HREmployeeStatus =
    e.contractStatus === 'active' ? 'active' :
    e.contractStatus === 'suspended' ? 'suspended' : 'active';
  return {
    id: e.id,
    bridgeId: e.employeeCode,
    nameAr: e.nameAr,
    nameEn: e.nameEn ?? e.nameAr,
    nationalId: e.nationalId ?? '',
    departmentId: '', // not in base employee response
    jobTitleAr: e.position ?? '',
    jobTitleEn: e.position ?? '',
    hireDate: e.startDate ?? '',
    status,
    email: e.email ?? undefined,
    mobile: e.phone ?? undefined,
    reportsToId: e.managerId ?? null,
    hierarchyRole: 'staff',
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

function uid() { return `emp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

interface DirectoryState {
  employees: HREmployeeDirectoryRow[];
  loadedCompanyId: string | null;
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: () => Promise<void>;
  addEmployee: (draft: Omit<HREmployeeDirectoryRow, 'id'>) => string; // local-only (optimistic)
  updateEmployee: (id: string, patch: Partial<Omit<HREmployeeDirectoryRow, 'id'>>) => void; // local-only
  deleteEmployee: (id: string) => void; // local-only
  getById: (id: string) => HREmployeeDirectoryRow | undefined;
  resetToSeed: () => void; // now calls fetch()
  // computed helpers
  activeEmployees: HREmployeeDirectoryRow[];
}

export const useHREmployeeDirectoryStore = create<DirectoryState>()((set, get) => ({
  employees: [],
  loadedCompanyId: null,
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;

    const { employees, loadedCompanyId, isLoading } = get();
    if (isLoading) return;
    if (loadedCompanyId === companyId && employees.length > 0) return;

    set({ isLoading: true, error: null });
    try {
      const result = await employeesApi.list({ companyId, limit: 500 });
      set({
        employees: result.items.map(mapApi),
        loadedCompanyId: companyId,
        isLoading: false,
      });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  addEmployee: (draft) => {
    const id = uid();
    set(s => ({ employees: [...s.employees, { ...draft, id }] }));
    return id;
  },

  updateEmployee: (id, patch) => {
    set(s => ({ employees: s.employees.map(e => e.id === id ? { ...e, ...patch } : e) }));
  },

  deleteEmployee: (id) => {
    set(s => ({
      employees: s.employees
        .filter(e => e.id !== id)
        .map(e => e.reportsToId === id ? { ...e, reportsToId: null } : e),
    }));
  },

  getById: (id) => get().employees.find(e => e.id === id),

  resetToSeed: () => { get().fetch(); },

  get activeEmployees() { return get().employees.filter(e => e.status === 'active'); },
}));
