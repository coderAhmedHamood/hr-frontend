import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { auditLogsApi } from './api/audit-logs';
import { ApiError } from '@/features/hr/lib/api/client';
import type { AuditLogResponseDto } from './api/audit-logs';
import type { HRDisciplineAuditLogEntry } from './discipline-audit-log';

function uid() {
  return `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function mapApi(r: AuditLogResponseDto): HRDisciplineAuditLogEntry {
  return {
    id: r.id,
    occurredAt: r.occurredAt,
    actorNameAr: r.actorName ?? '',
    category: r.entityName as HRDisciplineAuditLogEntry['category'],
    actionType: r.action as HRDisciplineAuditLogEntry['actionType'],
    recordId: r.entityId ?? '',
    recordRefAr: r.entityDisplayName ?? '',
    recordStatusAfterAr: r.actionNameAr ?? '',
    previousSnapshotAr: JSON.stringify(r.oldValues ?? {}),
    currentSnapshotAr: JSON.stringify(r.newValues ?? {}),
  };
}

interface AuditLogState {
  entries: HRDisciplineAuditLogEntry[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: () => Promise<void>;
  append: (payload: Omit<HRDisciplineAuditLogEntry, 'id' | 'occurredAt'>) => void;
}

export const useHRDisciplineAuditLogStore = create<AuditLogState>()((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await auditLogsApi.getAll({ companyId, moduleCode: 'discipline', limit: 200 });
      set({ entries: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  append: (payload) =>
    set((s) => ({
      entries: [
        {
          ...payload,
          id: uid(),
          occurredAt: new Date().toISOString(),
        },
        ...s.entries,
      ],
    })),
}));

/** تسجيل حدث من خارج المكوّنات (مخازن zustand) */
export function appendDisciplineAuditLog(payload: Omit<HRDisciplineAuditLogEntry, 'id' | 'occurredAt'>): void {
  useHRDisciplineAuditLogStore.getState().append(payload);
}
