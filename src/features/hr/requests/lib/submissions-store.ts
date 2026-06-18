import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  leaveRequestsNewApi,
  correctionRequestsApi,
  type ApiLeaveRequest,
  type ApiCorrectionRequest,
} from './api/correction-requests';
import type {
  HRRequestSubmissionRecord,
  HRSubmissionApprovalStageState,
} from './types';

function mapLeaveRequest(r: ApiLeaveRequest): HRRequestSubmissionRecord {
  const status = r.status === 'approved' ? 'approved'
    : r.status === 'rejected' ? 'rejected'
    : r.status === 'cancelled' ? 'rejected'
    : 'pending';

  return {
    id: r.id,
    createdAt: r.createdAt,
    employeeId: r.employeeId,
    employeeNameAr: r.employeeNameAr,
    employeeNameEn: '',
    requestTypeId: r.requestTypeId,
    requestTypeNameAr: r.requestTypeNameAr,
    requestTypeNameEn: '',
    departmentId: '',
    departmentNameAr: r.departmentNameAr ?? '',
    departmentNameEn: '',
    templateId: null,
    fieldValues: {
      'f-start': r.startDate,
      'f-end': r.endDate,
      'f-reason': r.reasonAr ?? '',
    },
    approvalSnapshot: r.decidedByEmployeeId
      ? {
          assignmentTemplateId: '',
          assignmentTemplateNameAr: '',
          stages: [
            {
              stageId: 'stage-1',
              mode: 'sequential',
              approverEmployeeIds: [r.decidedByEmployeeId],
              approverNamesAr: [],
              state: status as HRSubmissionApprovalStageState,
            },
          ],
        }
      : null,
  };
}

function mapCorrectionRequest(r: ApiCorrectionRequest): HRRequestSubmissionRecord {
  const status = r.status === 'approved' ? 'approved'
    : r.status === 'rejected' ? 'rejected'
    : r.status === 'cancelled' ? 'rejected'
    : 'pending';

  return {
    id: r.id,
    createdAt: r.createdAt,
    employeeId: r.employeeId,
    employeeNameAr: r.employeeNameAr,
    employeeNameEn: '',
    requestTypeId: r.requestTypeId,
    requestTypeNameAr: r.requestTypeNameAr,
    requestTypeNameEn: '',
    departmentId: '',
    departmentNameAr: r.departmentNameAr ?? '',
    departmentNameEn: '',
    templateId: null,
    fieldValues: {
      'f-start': r.workDate,
      'f-reason': r.reasonAr ?? '',
    },
    approvalSnapshot: r.decidedByEmployeeId
      ? {
          assignmentTemplateId: '',
          assignmentTemplateNameAr: '',
          stages: [
            {
              stageId: 'stage-1',
              mode: 'sequential',
              approverEmployeeIds: [r.decidedByEmployeeId],
              approverNamesAr: [],
              state: status as HRSubmissionApprovalStageState,
            },
          ],
        }
      : null,
  };
}

interface SubmissionsState {
  submissions: HRRequestSubmissionRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  addSubmission: (data: Omit<HRRequestSubmissionRecord, 'id' | 'createdAt'>) => void;
  deleteSubmission: (id: string) => void;
  patchSubmissionApprovalStage: (
    submissionId: string,
    stageIndex: number,
    state: HRSubmissionApprovalStageState,
  ) => void;
}

export const useHRRequestSubmissionsStore = create<SubmissionsState>()((set) => ({
  submissions: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const [leaveResult, correctionResult] = await Promise.all([
        leaveRequestsNewApi.list({ companyId, limit: 500 }),
        correctionRequestsApi.list({ companyId, limit: 500 }),
      ]);
      const submissions: HRRequestSubmissionRecord[] = [
        ...leaveResult.items.map(mapLeaveRequest),
        ...correctionResult.items.map(mapCorrectionRequest),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      set({ submissions, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  addSubmission: (data) => {
    const record: HRRequestSubmissionRecord = {
      ...data,
      id: `sub-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ submissions: [record, ...s.submissions] }));
  },

  deleteSubmission: (id) =>
    set((s) => ({ submissions: s.submissions.filter((r) => r.id !== id) })),

  patchSubmissionApprovalStage: (submissionId, stageIndex, state) => {
    set((s) => ({
      submissions: s.submissions.map((sub) => {
        if (sub.id !== submissionId || !sub.approvalSnapshot) return sub;
        const stages = sub.approvalSnapshot.stages.map((st, i) =>
          i === stageIndex ? { ...st, state } : st,
        );
        return { ...sub, approvalSnapshot: { ...sub.approvalSnapshot, stages } };
      }),
    }));
  },
}));
