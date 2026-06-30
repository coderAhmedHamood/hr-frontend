import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { disciplineApprovalTemplatesApi } from './api/discipline-approval-templates';
import { ApiError } from '@/features/hr/lib/api/client';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import type { DisciplineApprovalTemplateResponseDto } from './api/discipline-approval-templates';
import type { HRApprovalAssignmentTemplate } from '@/features/hr/requests/lib/types';

function mapApi(r: DisciplineApprovalTemplateResponseDto): HRApprovalAssignmentTemplate {
  const linkedIds = r.violationTypes.map((vt) => vt.violationTypeId);
  return {
    id: r.id,
    nameAr: r.nameAr ?? '',
    description: r.notes ?? '',
    assignmentLinkKind: 'violation',
    assignmentLinkedIds: linkedIds,
    violationTypeId: linkedIds[0] ?? null,
    isActive: r.isActive,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date(r.updatedAt).toISOString(),
    stages: [
      {
        id: r.id,
        sortOrder: 1,
        mode: r.approvalMode as 'sequential' | 'any_one',
        approvers: r.approvers.map((a) => ({ employeeId: a.employeeId, mandatory: true })),
      },
    ],
  };
}

/** معرفات أنواع المخالفات المرتبطة بالإسناد */
export function disciplineApprovalLinkedIds(t: HRApprovalAssignmentTemplate): string[] {
  const raw = t.assignmentLinkedIds?.filter(Boolean) ?? [];
  if (raw.length > 0) return raw;
  if (t.violationTypeId) return [t.violationTypeId];
  return [];
}

interface AAState {
  templates: HRApprovalAssignmentTemplate[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: () => Promise<void>;
  add: (draft: Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ ok: boolean; error?: string }>;
  update: (id: string, patch: Partial<Omit<HRApprovalAssignmentTemplate, 'id' | 'createdAt'>>) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<void>;
}

export const useHRDisciplineApprovalAssignmentTemplatesStore = create<AAState>()((set) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplineApprovalTemplatesApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() });
      set({ templates: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  add: async (draft) => {
    try {
      const companyId = getDefaultCompanyId() ?? '';
      const stage = draft.stages[0];
      const created = await disciplineApprovalTemplatesApi.create({
        companyId,
        nameAr: draft.nameAr,
        isActive: draft.isActive,
        approvalMode: (stage?.mode ?? 'sequential') as 'sequential' | 'parallel' | 'any_one' | 'optional',
        violationTypes: (draft.assignmentLinkedIds ?? []).map((id, i) => ({ violationTypeId: id, sortOrder: i })),
        approvers: (stage?.approvers ?? []).map((a, i) => ({ employeeId: a.employeeId, sortOrder: i })),
      });
      set((s) => ({ templates: [...s.templates, mapApi(created)] }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  update: async (id, patch) => {
    try {
      const stage = patch.stages?.[0];
      const updated = await disciplineApprovalTemplatesApi.update(id, {
        nameAr: patch.nameAr,
        isActive: patch.isActive,
        ...(stage ? { approvalMode: stage.mode as 'sequential' | 'parallel' | 'any_one' | 'optional' } : {}),
        ...(patch.assignmentLinkedIds ? { violationTypes: patch.assignmentLinkedIds.map((vtId, i) => ({ violationTypeId: vtId, sortOrder: i })) } : {}),
        ...(stage?.approvers ? { approvers: stage.approvers.map((a, i) => ({ employeeId: a.employeeId, sortOrder: i })) } : {}),
      });
      set((s) => ({ templates: s.templates.map((t) => (t.id === id ? mapApi(updated) : t)) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  remove: async (id) => {
    await disciplineApprovalTemplatesApi.remove(id);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
  },
}));
