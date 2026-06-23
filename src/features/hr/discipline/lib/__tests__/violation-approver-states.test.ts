import {
  buildApproverStatesFromAssignment,
  getViolationApproverActionContext,
  isViolationFullyApproved,
  applyViolationApproverDecision,
} from '@/features/hr/discipline/lib/violation-approver-states';
import type { DisciplineApprovalTemplateResponseDto } from '@/features/hr/discipline/lib/api/discipline-approval-templates';

function mockAssignment(): DisciplineApprovalTemplateResponseDto {
  return {
    id: 'assignment-1',
    companyId: 'company-1',
    nameAr: 'إسناد',
    approvalMode: 'sequential',
    displayOrder: 0,
    isActive: true,
    notes: null,
    violationTypes: [],
    approvers: [
      {
        id: 'a1',
        employeeId: 'emp-1',
        employeeNameAr: 'أول',
        employeeNameEn: null,
        sortOrder: 0,
      },
      {
        id: 'a2',
        employeeId: 'emp-2',
        employeeNameAr: 'ثاني',
        employeeNameEn: null,
        sortOrder: 1,
      },
    ],
    createdAt: '',
    updatedAt: '',
    createdBy: null,
    updatedBy: null,
  };
}

describe('violation-approver-states', () => {
  it('blocks second approver until first approves in sequential mode', () => {
    const states = buildApproverStatesFromAssignment(mockAssignment());
    expect(getViolationApproverActionContext(states, 'emp-1').canAct).toBe(true);
    expect(getViolationApproverActionContext(states, 'emp-2').canAct).toBe(false);

    const afterFirst = applyViolationApproverDecision(states, 'emp-1', 'approve', {
      decidedBy: 'user-1',
      notes: null,
    });
    expect(getViolationApproverActionContext(afterFirst, 'emp-2').canAct).toBe(true);
    expect(isViolationFullyApproved(afterFirst)).toBe(false);

    const afterSecond = applyViolationApproverDecision(afterFirst, 'emp-2', 'approve', {
      decidedBy: 'user-2',
      notes: null,
    });
    expect(isViolationFullyApproved(afterSecond)).toBe(true);
  });
});
