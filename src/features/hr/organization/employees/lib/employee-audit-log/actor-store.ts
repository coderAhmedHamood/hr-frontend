import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ActorState = {
  /** معرف الموظف الذي يُسجَّل الإجراء باسمه؛ `system` = النظام بدون مستخدم محدد */
  actorEmployeeId: string;
  setActorEmployeeId: (id: string) => void;
};

export const AUDIT_ACTOR_SYSTEM = 'system';

export const useEmployeeAuditActorStore = create<ActorState>()(
  persist(
    (set) => ({
      actorEmployeeId: AUDIT_ACTOR_SYSTEM,
      setActorEmployeeId: (id) => set({ actorEmployeeId: id }),
    }),
    {
      name: 'rose-hr-employee-audit-actor-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
