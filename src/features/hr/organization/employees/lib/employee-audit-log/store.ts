import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { genId } from '@/features/hr/attendance/lib/utils';
import { useEmployeeAuditActorStore } from '@/features/hr/organization/employees/lib/employee-audit-log/actor-store';
import type { EmployeeAuditEntry, EmployeeAuditRowInput } from '@/features/hr/organization/employees/lib/employee-audit-log/types';

const STORAGE_KEY = 'rose-hr-employee-audit-log-v1';
const MAX_PER_EMPLOYEE = 600;

function nowIso() {
  return new Date().toISOString();
}

function resolveActor(): { actorEmployeeId: string | null; actorNameAr: string } {
  const raw = useEmployeeAuditActorStore.getState().actorEmployeeId;
  if (!raw || raw === 'system') return { actorEmployeeId: null, actorNameAr: 'النظام' };
  return { actorEmployeeId: raw, actorNameAr: raw };
}

/** مرجع ثابت لمشترك Zustand (لا تُنشئ مصفوفة جديدة عند غياب سجلات). */
export const EMPTY_EMPLOYEE_AUDIT_LOG: EmployeeAuditEntry[] = [];

type State = {
  byEmployee: Record<string, EmployeeAuditEntry[]>;
  append: (targetEmployeeId: string, rows: EmployeeAuditRowInput[]) => void;
};

export const useEmployeeAuditLogStore = create<State>()(
  persist(
    (set) => ({
      byEmployee: {},

      append: (targetEmployeeId, rows) => {
        if (rows.length === 0) return;
        const actor = resolveActor();
        const stamped: EmployeeAuditEntry[] = rows.map((r) => ({
          ...r,
          id: genId('eaud'),
          at: nowIso(),
          targetEmployeeId,
          actorEmployeeId: actor.actorEmployeeId,
          actorNameAr: actor.actorNameAr,
        }));
        set((s) => {
          const cur = s.byEmployee[targetEmployeeId] ?? EMPTY_EMPLOYEE_AUDIT_LOG;
          const merged = [...stamped, ...cur].slice(0, MAX_PER_EMPLOYEE);
          return { byEmployee: { ...s.byEmployee, [targetEmployeeId]: merged } };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
