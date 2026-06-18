import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';
import {
  notificationsApi,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';

export type EmploymentContractCreatedNotificationInput = {
  companyId: string;
  contractId: string;
  employeeId: string;
  contractNumber: string;
  startDate: string;
  createdBy?: string | null;
};

export async function sendEmploymentContractCreatedNotification(
  input: EmploymentContractCreatedNotificationInput,
) {
  if (!input.employeeId.trim()) return null;

  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'contract',
    severity: 'info',
    titleAr: `عقد عمل جديد — ${input.contractNumber}`,
    bodyAr: `تم إنشاء عقد عمل جديد برقم ${input.contractNumber} يبدأ في ${input.startDate}. يرجى مراجعته في ملفك الوظيفي.`,
    audienceKind: 'employee',
    employeeIds: [input.employeeId],
    deliveryChannel: 'in_app',
    sourceKind: 'employment_contract_created',
    sourceTable: 'hr_payroll_employee_contracts',
    sourceId: input.contractId,
    actionUrl: hrOrganizationRoutes.employee(input.employeeId),
    actionLabelAr: 'عرض الملف الوظيفي',
    requiresAcknowledgment: true,
    createdBy: input.createdBy ?? null,
  };

  return notificationsApi.send(dto);
}
