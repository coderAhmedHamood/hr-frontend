import {
  notificationsApi,
  type NotificationSeverity,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';
import {
  disciplineAppealsApi,
  type ProcessDisciplineAppealDecisionDto,
} from '@/features/hr/discipline/lib/api/discipline-appeals';
import { APPEAL_STATUS_LABELS } from '@/features/hr/discipline/lib/types';
import type { HRAppealStatus } from '@/features/hr/discipline/lib/types';

const DECISION_STATUS_LABELS: Record<ProcessDisciplineAppealDecisionDto['status'], string> = {
  accepted: APPEAL_STATUS_LABELS.accepted,
  rejected: APPEAL_STATUS_LABELS.rejected,
  under_review: APPEAL_STATUS_LABELS.under_review,
  withdrawn: APPEAL_STATUS_LABELS.withdrawn,
};

const DECISION_SEVERITY: Record<ProcessDisciplineAppealDecisionDto['status'], NotificationSeverity> = {
  accepted: 'success',
  rejected: 'error',
  under_review: 'warning',
  withdrawn: 'info',
};

export type AppealDecisionNotificationInput = {
  companyId: string;
  appealId: string;
  employeeId: string;
  caseNumber: string;
  status: ProcessDisciplineAppealDecisionDto['status'];
  responseNote: string;
  triggeredByUserId?: string;
  triggeredByNameAr?: string | null;
  createdBy?: string | null;
};

export async function submitAppealDecision(
  appealId: string,
  payload: ProcessDisciplineAppealDecisionDto,
) {
  return disciplineAppealsApi.decide(appealId, payload);
}

export async function sendAppealDecisionNotification(input: AppealDecisionNotificationInput) {
  const statusLabel = DECISION_STATUS_LABELS[input.status];
  const bodyParts = [
    `تم تحديث حالة تظلمك (${input.caseNumber}) إلى: ${statusLabel}.`,
    input.responseNote.trim() ? `رد الموارد البشرية: ${input.responseNote.trim()}` : null,
  ].filter(Boolean);

  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'discipline',
    severity: DECISION_SEVERITY[input.status],
    titleAr: `معالجة التظلم — ${statusLabel}`,
    bodyAr: bodyParts.join('\n'),
    audienceKind: 'employee',
    employeeIds: [input.employeeId],
    deliveryChannel: 'in_app',
    sourceKind: 'discipline_appeal_decision',
    sourceTable: 'hr_job_discipline_appeals',
    sourceId: input.appealId,
    actionUrl: '/hr/discipline/appeals',
    actionLabelAr: 'عرض التظلمات',
    requiresAcknowledgment: input.status === 'accepted' || input.status === 'rejected',
    triggeredByUserId: input.triggeredByUserId,
    triggeredByNameAr: input.triggeredByNameAr ?? null,
    createdBy: input.createdBy ?? null,
  };

  return notificationsApi.send(dto);
}

export function isFinalAppealDecisionStatus(status: HRAppealStatus | ProcessDisciplineAppealDecisionDto['status']) {
  return status === 'accepted' || status === 'rejected' || status === 'withdrawn';
}

export function canMutateAppealRecord(status: HRAppealStatus) {
  return !isFinalAppealDecisionStatus(status);
}

export function canDeleteAppealRecord(status: HRAppealStatus) {
  return status === 'pending';
}

export { DECISION_STATUS_LABELS };
