import type {
  NotificationAudienceEmployeeDto,
  NotificationAudienceKind,
  NotificationCategory,
  NotificationSeverity,
  SentNotificationResponseDto,
} from '@/features/hr/notifications/lib/api/notifications';

export type NotificationAudienceEmployee = {
  employeeId: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string | null;
};

export type HRAdminNotificationRecord = {
  id: string;
  companyId: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  titleAr: string;
  bodyAr: string;
  audienceKind: NotificationAudienceKind;
  audienceSummaryAr: string;
  audienceEmployees: NotificationAudienceEmployee[];
  sourceKind: string | null;
  actionUrl: string | null;
  actionLabelAr: string | null;
  requiresAcknowledgment: boolean;
  recipientCount: number;
  readCount: number;
  createdAt: string;
  triggeredByNameAr: string | null;
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  leave: 'إجازات',
  discipline: 'انضباط',
  payroll: 'رواتب',
  contract: 'عقود',
  attendance: 'حضور',
  advance: 'سلف',
  announcement: 'إعلان',
  system: 'نظام',
};

export const NOTIFICATION_SEVERITY_LABELS: Record<NotificationSeverity, string> = {
  info: 'معلومة',
  success: 'نجاح',
  warning: 'تحذير',
  error: 'تنبيه',
};

export const NOTIFICATION_AUDIENCE_LABELS: Record<NotificationAudienceKind, string> = {
  employee: 'موظفون محددون',
  branch: 'فرع',
  department: 'قسم',
  company: 'جميع الموظفين',
};

export const NOTIFICATION_CATEGORY_FILTER_ORDER: NotificationCategory[] = [
  'announcement',
  'discipline',
  'leave',
  'attendance',
  'payroll',
  'advance',
  'contract',
  'system',
];

function mapAudienceEmployee(row: NotificationAudienceEmployeeDto): NotificationAudienceEmployee {
  return {
    employeeId: row.employeeId,
    employeeCode: row.employeeCode,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
  };
}

export function formatAudienceEmployeesLabel(employees: NotificationAudienceEmployee[]): string {
  if (employees.length === 0) return '';
  return employees
    .map((e) => `${e.nameAr ?? '—'} (${e.employeeCode ?? '—'})`)
    .join('، ');
}

export function mapSentNotification(
  row: SentNotificationResponseDto,
  audienceSummaryAr: string,
): HRAdminNotificationRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    category: row.category,
    severity: row.severity,
    titleAr: row.titleAr,
    bodyAr: row.bodyAr ?? '',
    audienceKind: row.audienceKind,
    audienceSummaryAr,
    audienceEmployees: (row.audienceEmployees ?? []).map(mapAudienceEmployee),
    sourceKind: row.sourceKind,
    actionUrl: row.actionUrl,
    actionLabelAr: row.actionLabelAr,
    requiresAcknowledgment: row.requiresAcknowledgment,
    recipientCount: row.recipientCount,
    readCount: row.readCount,
    createdAt: row.createdAt,
    triggeredByNameAr: row.triggeredByNameAr,
  };
}
