import { create } from 'zustand';
import type {
  HRDepartmentEntity, HRRequestTemplateEntity, HRRequestTypeEntity,
  HRRequestFieldDefinition, HRApprovalStage,
} from './types';
import { HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID, normalizeRequestCategory, slugify } from './types';
import { requestTypesApi, type ApiRequestType } from './api/request-types';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString(); }

function getDescendantIds(depts: HRDepartmentEntity[], id: string): string[] {
  const children = depts.filter(d => d.parentId === id).map(d => d.id);
  return [...children, ...children.flatMap(cid => getDescendantIds(depts, cid))];
}

function mapDepartment(r: DepartmentResponseDto): HRDepartmentEntity {
  return {
    id: r.id,
    nameAr: r.nameAr,
    nameEn: r.nameEn ?? '',
    slug: r.code.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    sortOrder: r.levelNo ?? 0,
    isActive: r.isActive,
    parentId: r.parentDepartmentId ?? undefined,
  };
}

// ─── Mapping API → frontend type ─────────────────────────────────────────────

export function mapApiRequestType(r: ApiRequestType): HRRequestTypeEntity {
  return {
    id: r.id,
    departmentId: r.departmentId ?? HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
    nameAr: r.nameAr,
    nameEn: r.nameEn,
    slug: r.slug,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    requestCategory: normalizeRequestCategory(r.requestCategory),
    approvalAssignmentTemplateId: r.approvalAssignmentTemplateId ?? null,
    approvalStages: (r.approvalStages ?? []) as unknown as HRApprovalStage[],
    subtypes: (r.subtypes ?? []).map(s => ({
      id: s.slug,
      nameAr: s.nameAr,
      nameEn: s.nameEn ?? '',
      slug: s.slug,
      sortOrder: s.sortOrder ?? 0,
      isActive: s.isActive ?? true,
    })),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface HRConfigState {
  departments: HRDepartmentEntity[];
  departmentsLoading: boolean;
  templates: HRRequestTemplateEntity[];
  requestTypes: HRRequestTypeEntity[];
  requestTypesLoading: boolean;
  requestTypesError: string | null;

  // Departments — async (backed by API)
  fetchDepartments: () => Promise<void>;

  // Request types — async (backed by API)
  fetchRequestTypes: (params?: { requestCategory?: string; isActive?: boolean }) => Promise<void>;
  addRequestType: (draft: Omit<HRRequestTypeEntity, 'id' | 'slug'>) => Promise<void>;
  updateRequestType: (id: string, patch: Partial<Omit<HRRequestTypeEntity, 'id'>>) => Promise<void>;
  deleteRequestType: (id: string) => Promise<void>;
  getRequestTypeBySlugs: (deptSlug: string, typeSlug: string) => { dept: HRDepartmentEntity | null; type: HRRequestTypeEntity } | null;

  // Templates — local only
  addTemplate: (draft: Omit<HRRequestTemplateEntity, 'id' | 'slug'>) => void;
  updateTemplate: (id: string, patch: Partial<Omit<HRRequestTemplateEntity, 'id'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string | null | undefined) => HRRequestTemplateEntity | undefined;

  // Departments — local only
  addDepartment: (draft: Omit<HRDepartmentEntity, 'id' | 'slug'>) => { ok: boolean; error?: string };
  updateDepartment: (id: string, patch: Partial<Omit<HRDepartmentEntity, 'id'>>) => { ok: boolean; error?: string };
  deleteDepartment: (id: string) => { ok: boolean; error?: string; affectedRequestTypes?: number };
}

export const useHRConfigurationStore = create<HRConfigState>()((set, get) => ({
      departments: [],
      departmentsLoading: false,
      templates: [],
      requestTypes: [],
      requestTypesLoading: false,
      requestTypesError: null,

      // ── Departments (API-backed) ────────────────────────────────────────────

      fetchDepartments: async () => {
        const companyId = getDefaultCompanyId();
        if (!companyId) return;
        set({ departmentsLoading: true });
        try {
          const result = await departmentsApi.getAll({ companyId, limit: 500 });
          set({ departments: result.items.map(mapDepartment), departmentsLoading: false });
        } catch {
          set({ departmentsLoading: false });
        }
      },

      // ── Request types (API-backed) ──────────────────────────────────────────

      fetchRequestTypes: async (params?: { requestCategory?: string; isActive?: boolean }) => {
        const companyId = getDefaultCompanyId();
        if (!companyId) return;
        set({ requestTypesLoading: true, requestTypesError: null });
        try {
          const result = await requestTypesApi.list({ companyId, limit: 200, ...params });
          set({ requestTypes: result.items.map(mapApiRequestType), requestTypesLoading: false });
        } catch (e) {
          set({ requestTypesError: (e as Error).message, requestTypesLoading: false });
        }
      },

      addRequestType: async (draft) => {
        const companyId = getDefaultCompanyId() ?? '';
        // POST only accepts basic fields — departmentId, approvalStages, subtypes are PATCH-only
        let created = await requestTypesApi.create({
          companyId,
          nameAr: draft.nameAr,
          nameEn: draft.nameEn,
          slug: slugify(draft.nameAr),
          requestCategory: draft.requestCategory,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
        });
        // Apply advanced fields via PATCH if any are provided
        const deptId = draft.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID ? null : (draft.departmentId ?? null);
        const hasAdvanced = deptId !== null || (draft.approvalStages?.length ?? 0) > 0 || (draft.subtypes?.length ?? 0) > 0;
        if (hasAdvanced) {
          created = await requestTypesApi.update(created.id, {
            departmentId: deptId,
            approvalStages: draft.approvalStages as never[] | undefined,
            subtypes: draft.subtypes?.map(s => ({
              slug: s.slug,
              nameAr: s.nameAr,
              nameEn: s.nameEn,
              sortOrder: s.sortOrder,
              isActive: s.isActive,
            })),
          });
        }
        set(s => ({ requestTypes: [...s.requestTypes, mapApiRequestType(created)] }));
      },

      updateRequestType: async (id, patch) => {
        const updated = await requestTypesApi.update(id, {
          nameAr: patch.nameAr,
          nameEn: patch.nameEn,
          slug: patch.nameAr ? slugify(patch.nameAr) : undefined,
          requestCategory: patch.requestCategory,
          sortOrder: patch.sortOrder,
          isActive: patch.isActive,
          approvalStages: patch.approvalStages as never[] | undefined,
          subtypes: patch.subtypes?.map(s => ({
            slug: s.slug,
            nameAr: s.nameAr,
            nameEn: s.nameEn,
            sortOrder: s.sortOrder,
            isActive: s.isActive,
          })),
        });
        set(s => ({
          requestTypes: s.requestTypes.map(r => r.id === id ? mapApiRequestType(updated) : r),
        }));
      },

      deleteRequestType: async (id) => {
        await requestTypesApi.delete(id);
        set(s => ({ requestTypes: s.requestTypes.filter(r => r.id !== id) }));
      },

      getRequestTypeBySlugs: (deptSlug, typeSlug) => {
        const { departments, requestTypes } = get();
        const rt = requestTypes.find(r => r.slug === typeSlug);
        if (!rt) return null;
        const dept = rt.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID
          ? null
          : departments.find(d => d.slug === deptSlug) ?? null;
        return { dept, type: rt };
      },

      // ── Templates (local) ───────────────────────────────────────────────────

      addTemplate: (draft) => {
        const isFirst = get().templates.filter(t => t.isUniversalDefault).length === 0;
        const tpl: HRRequestTemplateEntity = {
          ...draft,
          id: `tpl-${uid()}`,
          slug: slugify(draft.nameAr),
          isUniversalDefault: draft.isUniversalDefault || isFirst,
        };
        set((s) => {
          let templates = [...s.templates, tpl];
          if (tpl.isUniversalDefault) {
            templates = templates.map(t => t.id === tpl.id ? t : { ...t, isUniversalDefault: false });
          }
          return { templates };
        });
      },

      updateTemplate: (id, patch) => {
        set((s) => {
          let templates = s.templates.map(t =>
            t.id === id ? { ...t, ...patch, slug: patch.nameAr ? slugify(patch.nameAr) : t.slug } : t
          );
          if (patch.isUniversalDefault) {
            templates = templates.map(t => t.id === id ? t : { ...t, isUniversalDefault: false });
          }
          return { templates };
        });
      },

      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter(t => t.id !== id) })),

      getTemplateById: (id) => {
        if (!id) return undefined;
        return get().templates.find(t => t.id === id);
      },

      // ── Departments (local) ─────────────────────────────────────────────────

      addDepartment: (draft) => {
        const { departments } = get();
        const slug = slugify(draft.nameAr);
        if (departments.some(d => d.slug === slug)) return { ok: false, error: 'يوجد قسم بنفس الاسم / الرمز' };
        const dept: HRDepartmentEntity = { ...draft, id: `dept-${uid()}`, slug };
        set(s => ({ departments: [...s.departments, dept] }));
        return { ok: true };
      },

      updateDepartment: (id, patch) => {
        const { departments } = get();
        if (patch.nameAr) {
          const newSlug = slugify(patch.nameAr);
          if (departments.some(d => d.slug === newSlug && d.id !== id)) return { ok: false, error: 'يوجد قسم بنفس الاسم / الرمز' };
        }
        set(s => ({
          departments: s.departments.map(d =>
            d.id === id ? { ...d, ...patch, slug: patch.nameAr ? slugify(patch.nameAr) : d.slug } : d
          ),
        }));
        return { ok: true };
      },

      deleteDepartment: (id) => {
        const { departments, requestTypes } = get();
        const descendants = getDescendantIds(departments, id);
        const toDelete = new Set([id, ...descendants]);
        const affected = requestTypes.filter(rt => toDelete.has(rt.departmentId)).length;
        set(s => ({
          departments: s.departments.filter(d => !toDelete.has(d.id)),
          requestTypes: s.requestTypes.filter(rt => !toDelete.has(rt.departmentId)),
        }));
        return { ok: true, affectedRequestTypes: affected };
      },
}));
