import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** وصول التعميم / كشف الراتب للموظف */
export type PayrollSalaryCircularSendStatus = 'not_sent' | 'sent';

/** هل اطلع الموظف على التفاصيل */
export type PayrollSalaryCircularReadStatus = 'not_read' | 'read';

/** موافقة الموظف على صحة المستحق قبل إصدار المسير */
export type PayrollSalaryCircularApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'ignored';

export interface PayrollSalaryCircularEntry {
  sendStatus: PayrollSalaryCircularSendStatus;
  sentAt: string | null;
  readStatus: PayrollSalaryCircularReadStatus;
  readAt: string | null;
  approvalStatus: PayrollSalaryCircularApprovalStatus;
  respondedAt: string | null;
}

export const DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY: PayrollSalaryCircularEntry = {
  sendStatus: 'not_sent',
  sentAt: null,
  readStatus: 'not_read',
  readAt: null,
  approvalStatus: 'pending',
  respondedAt: null,
};

export function getPayrollSalaryCircularEntryKey(periodId: string, employmentLineId: string) {
  return `${periodId}::${employmentLineId}`;
}

function nowIso() {
  return new Date().toISOString();
}

interface State {
  /** مفتاح: periodId::employmentLineId */
  entries: Record<string, PayrollSalaryCircularEntry>;
  getEntry: (periodId: string, employmentLineId: string) => PayrollSalaryCircularEntry;
  setSendStatus: (periodId: string, employmentLineId: string, status: PayrollSalaryCircularSendStatus) => void;
  markAllSent: (periodId: string, employmentLineIds: string[]) => void;
  setReadStatus: (periodId: string, employmentLineId: string, status: PayrollSalaryCircularReadStatus) => void;
  setApprovalStatus: (
    periodId: string,
    employmentLineId: string,
    status: PayrollSalaryCircularApprovalStatus,
  ) => void;
  resetLine: (periodId: string, employmentLineId: string) => void;
}

export const usePayrollSalaryCircularStore = create<State>()(
  persist(
    (set, get) => ({
      entries: {},

      getEntry: (periodId, employmentLineId) => ({
        ...DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY,
        ...get().entries[getPayrollSalaryCircularEntryKey(periodId, employmentLineId)],
      }),

      setSendStatus: (periodId, employmentLineId, status) => {
        const k = getPayrollSalaryCircularEntryKey(periodId, employmentLineId);
        set((s) => {
          const prev = { ...DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY, ...s.entries[k] };
          return {
            entries: {
              ...s.entries,
              [k]: {
                ...prev,
                sendStatus: status,
                sentAt: status === 'sent' ? (prev.sentAt ?? nowIso()) : null,
                readStatus: status === 'sent' ? prev.readStatus : 'not_read',
                readAt: status === 'sent' ? prev.readAt : null,
                approvalStatus: status === 'sent' ? prev.approvalStatus : 'pending',
                respondedAt: status === 'sent' ? prev.respondedAt : null,
              },
            },
          };
        });
      },

      markAllSent: (periodId, employmentLineIds) => {
        const t = nowIso();
        set((s) => {
          const next = { ...s.entries };
          for (const lineId of employmentLineIds) {
            const k = getPayrollSalaryCircularEntryKey(periodId, lineId);
            const prev = { ...DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY, ...next[k] };
            next[k] = { ...prev, sendStatus: 'sent' as const, sentAt: prev.sentAt ?? t };
          }
          return { entries: next };
        });
      },

      setReadStatus: (periodId, employmentLineId, status) => {
        const k = getPayrollSalaryCircularEntryKey(periodId, employmentLineId);
        set((s) => {
          const prev = { ...DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY, ...s.entries[k] };
          const readAt = status === 'read' ? (prev.readAt ?? nowIso()) : null;
          return {
            entries: {
              ...s.entries,
              [k]: {
                ...prev,
                sendStatus: status === 'read' ? 'sent' : prev.sendStatus,
                sentAt: status === 'read' ? (prev.sentAt ?? readAt) : prev.sentAt,
                readStatus: status,
                readAt,
                approvalStatus: status === 'read' ? prev.approvalStatus : 'pending',
                respondedAt: status === 'read' ? prev.respondedAt : null,
              },
            },
          };
        });
      },

      setApprovalStatus: (periodId, employmentLineId, status) => {
        const k = getPayrollSalaryCircularEntryKey(periodId, employmentLineId);
        set((s) => {
          const prev = { ...DEFAULT_PAYROLL_SALARY_CIRCULAR_ENTRY, ...s.entries[k] };
          const t = nowIso();
          const hasResponse = status !== 'pending';
          return {
            entries: {
              ...s.entries,
              [k]: {
                ...prev,
                sendStatus: hasResponse ? 'sent' : prev.sendStatus,
                sentAt: hasResponse ? (prev.sentAt ?? t) : prev.sentAt,
                readStatus: hasResponse ? 'read' : prev.readStatus,
                readAt: hasResponse ? (prev.readAt ?? t) : prev.readAt,
                approvalStatus: status,
                respondedAt: hasResponse ? (prev.respondedAt ?? t) : null,
              },
            },
          };
        });
      },

      resetLine: (periodId, employmentLineId) => {
        const k = getPayrollSalaryCircularEntryKey(periodId, employmentLineId);
        set((s) => {
          const next = { ...s.entries };
          delete next[k];
          return { entries: next };
        });
      },
    }),
    {
      name: 'hr_payroll_salary_circular_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);

export const SEND_STATUS_LABELS_AR: Record<PayrollSalaryCircularSendStatus, string> = {
  not_sent: 'لم يُرسل',
  sent: 'تم الإرسال',
};

export const READ_STATUS_LABELS_AR: Record<PayrollSalaryCircularReadStatus, string> = {
  not_read: 'لم تُقرأ',
  read: 'تمت القراءة',
};

export const APPROVAL_STATUS_LABELS_AR: Record<PayrollSalaryCircularApprovalStatus, string> = {
  pending: 'بانتظار الرد',
  approved: 'موافق',
  rejected: 'مرفوض',
  ignored: 'تجاهل',
};
