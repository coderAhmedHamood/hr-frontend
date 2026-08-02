import {
  notificationsApi,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';

type RoseFormSendNotificationInput = {
  companyId: string;
  employeeId: string;
  createdBy?: string | null;
};

/** سند راتب — بعد إرسال المسودة للتوقيع */
export async function sendSalaryVoucherToEmployeeNotification(
  input: RoseFormSendNotificationInput & {
    voucherId: string;
    voucherNumber: string;
  },
) {
  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'payroll',
    severity: 'info',
    titleAr: `سند راتب — ${input.voucherNumber}`,
    bodyAr:
      'يرجى فتح سند الراتب، قراءته بالكامل، ثم تأكيده بالتوقيع (رسم أو رفع ملف موقّع).',
    audienceKind: 'employee',
    employeeIds: [input.employeeId],
    deliveryChannel: 'in_app',
    sourceKind: 'cash_receipt_signature',
    sourceTable: 'hr_cash_receipt_vouchers',
    sourceId: input.voucherId,
    actionLabelAr: 'فتح سند الراتب والتأكيد',
    requiresAcknowledgment: true,
    createdBy: input.createdBy ?? null,
  };
  return notificationsApi.send(dto);
}

/** استقالة — بعد إرسال المسودة للموظف */
export async function sendResignationToEmployeeNotification(
  input: RoseFormSendNotificationInput & {
    resignationId: string;
    resignationNumber: string;
  },
) {
  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'contract',
    severity: 'info',
    titleAr: `طلب استقالة — ${input.resignationNumber}`,
    bodyAr:
      'تم إرسال نموذج الاستقالة إليك. يرجى مراجعته والتوقيع (رسم أو رفع ملف موقّع).',
    audienceKind: 'employee',
    employeeIds: [input.employeeId],
    deliveryChannel: 'in_app',
    sourceKind: 'employee_resignation_pending_signature',
    sourceTable: 'hr_employee_resignations',
    sourceId: input.resignationId,
    actionLabelAr: 'فتح الاستقالة والتوقيع',
    requiresAcknowledgment: false,
    createdBy: input.createdBy ?? null,
  };
  return notificationsApi.send(dto);
}

/** إخلاء طرف — بعد إرسال المسودة للموظف */
export async function sendClearanceToEmployeeNotification(
  input: RoseFormSendNotificationInput & {
    clearanceId: string;
    clearanceNumber: string;
  },
) {
  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'contract',
    severity: 'info',
    titleAr: `إخلاء طرف — ${input.clearanceNumber}`,
    bodyAr:
      'تم إرسال نموذج إخلاء الطرف إليك. يرجى مراجعته والتوقيع (رسم أو رفع ملف موقّع).',
    audienceKind: 'employee',
    employeeIds: [input.employeeId],
    deliveryChannel: 'in_app',
    sourceKind: 'employee_clearance_pending_signature',
    sourceTable: 'hr_employee_clearances',
    sourceId: input.clearanceId,
    actionLabelAr: 'فتح إخلاء الطرف والتوقيع',
    requiresAcknowledgment: false,
    createdBy: input.createdBy ?? null,
  };
  return notificationsApi.send(dto);
}

/** مخالصة نهائية — بعد إرسال المسودة للموظف */
export async function sendSettlementToEmployeeNotification(
  input: RoseFormSendNotificationInput & {
    settlementId: string;
    referenceNo: string;
  },
) {
  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'announcement',
    severity: 'info',
    titleAr: `مخالصة نهائية — ${input.referenceNo}`,
    bodyAr:
      'تم إرسال المخالصة النهائية إليك. يرجى مراجعتها والتوقيع (رسم أو رفع ملف موقّع).',
    audienceKind: 'employee',
    employeeIds: [input.employeeId],
    deliveryChannel: 'in_app',
    sourceKind: 'employee_settlement_pending_signature',
    sourceTable: 'rose_employee_settlements',
    sourceId: input.settlementId,
    actionLabelAr: 'فتح المخالصة والتوقيع',
    requiresAcknowledgment: true,
    createdBy: input.createdBy ?? null,
  };
  return notificationsApi.send(dto);
}

/** تعميم استخدام الجوال — بعد إرساله للموظف للتوقيع */
export async function sendMobileCircularToEmployeeNotification(
  input: RoseFormSendNotificationInput & {
    circularId: string;
    circularNumber: string;
  },
) {
  const dto: SendNotificationDto = {
    companyId: input.companyId,
    category: 'announcement',
    severity: 'info',
    titleAr: `تعميم استخدام الجوال — ${input.circularNumber}`,
    bodyAr:
      'تم إرسال تعميم استخدام الجوال إليك. يرجى قراءته بالكامل ثم التوقيع بالتعهد (رسم أو رفع ملف موقّع).',
    audienceKind: 'employee',
    employeeIds: [input.employeeId],
    deliveryChannel: 'in_app',
    sourceKind: 'employee_mobile_circular_pending_signature',
    sourceTable: 'hr_employee_mobile_circulars',
    sourceId: input.circularId,
    actionLabelAr: 'فتح التعميم والتوقيع',
    requiresAcknowledgment: false,
    createdBy: input.createdBy ?? null,
  };
  return notificationsApi.send(dto);
}
