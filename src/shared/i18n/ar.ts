/**
 * Shared Arabic labels for common workflow statuses.
 * Import from here instead of redefining pending/approved/rejected in feature files.
 */
export const AR_STATUS = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  approvedFormal: 'معتمد',
  rejected: 'مرفوض',
  cancelled: 'ملغاة',
  cancelledShort: 'ملغى',
  needsEdit: 'يحتاج تعديل',
  pendingApproval: 'قيد الموافقة',
  inReview: 'قيد المراجعة',
  draft: 'مسودة',
  accepted: 'مقبول',
  withdrawn: 'متراجع عنه',
} as const;

/** Approval chain modes (sequential / parallel / …). */
export const AR_APPROVAL_MODE_LABELS = {
  sequential: 'تتابعي',
  parallel: 'متوازي',
  any_one: 'موافقة أحد المعتمدين',
  optional: 'اختياري',
} as const;

/** Leave requests, employee requests, unified leave management. */
export const AR_LEAVE_STATUS_LABELS = {
  pending: AR_STATUS.pending,
  approved: AR_STATUS.approved,
  rejected: AR_STATUS.rejected,
  cancelled: AR_STATUS.cancelled,
} as const;

/** Leave balance credit requests (same workflow as leave). */
export const AR_LEAVE_BALANCE_CREDIT_STATUS_LABELS = AR_LEAVE_STATUS_LABELS;

/** Violation / request approver step statuses (formal «معتمد»). */
export const AR_FORMAL_APPROVAL_STATUS_LABELS = {
  pending: AR_STATUS.pending,
  approved: AR_STATUS.approvedFormal,
  rejected: AR_STATUS.rejected,
} as const;

/** Violation record list filters. */
export const AR_VIOLATION_RECORD_STATUS_LABELS = {
  pending: AR_STATUS.pending,
  approved: AR_STATUS.approvedFormal,
  rejected: AR_STATUS.rejected,
  needs_edit: AR_STATUS.needsEdit,
} as const;

/** Attendance correction requests. */
export const AR_CORRECTION_REQUEST_STATUS_LABELS = {
  pending: AR_STATUS.pendingApproval,
  approved: AR_STATUS.approvedFormal,
  rejected: AR_STATUS.rejected,
  cancelled: AR_STATUS.cancelledShort,
} as const;

/** Per-entity approval action messages (not among approvers, already decided, …). */
export const AR_APPROVAL_WORKFLOW_MESSAGES = {
  request: {
    notAmongApprovers: 'أنت لست ضمن المعتمدين المسندين لهذا النوع من الطلبات.',
    alreadyDecided: 'تم تسجيل قرارك مسبقاً على هذا الطلب.',
    rejectedLocked: 'تم رفض الطلب ولا يمكن اتخاذ قرار جديد.',
    approvedByOther: 'تم اعتماد الطلب من معتمد آخر.',
    waitingPriorApprovers: 'بانتظار موافقة المعتمدين السابقين في الترتيب.',
  },
  violation: {
    notAmongApprovers: 'أنت لست ضمن المعتمدين المسندين لهذا النوع من المخالفات.',
    alreadyDecided: 'تم تسجيل قرارك مسبقاً على هذه المخالفة.',
    rejectedLocked: 'تم رفض المخالفة ولا يمكن اتخاذ قرار جديد.',
    approvedByOther: 'تم اعتماد المخالفة من معتمد آخر.',
    waitingPriorApprovers: 'بانتظار موافقة المعتمدين السابقين في الترتيب.',
  },
} as const;

/** Access-check errors when loading approval assignment templates. */
export const AR_APPROVAL_ACCESS_MESSAGES = {
  request: {
    notLinked: 'لم يتم ربط حسابك بسجل موظف؛ لا يمكنك اعتماد أو رفض الطلبات.',
    companyUnknown: 'تعذر تحديد الشركة.',
    inactive: 'إسناد الموافقة غير نشط لهذا النوع من الطلبات.',
    notAmongApprovers: AR_APPROVAL_WORKFLOW_MESSAGES.request.notAmongApprovers,
    cannotActFallback: 'لا يمكنك اتخاذ قرار على هذا الطلب الآن.',
    notFound: 'لا يوجد إسناد موافقة لهذا النوع من الطلبات.',
  },
  violation: {
    notLinked: 'لم يتم ربط حسابك بسجل موظف؛ لا يمكنك اعتماد أو رفض المخالفات.',
    inactive: 'إسناد الموافقة غير نشط لهذا النوع من المخالفات.',
    notAmongApprovers: AR_APPROVAL_WORKFLOW_MESSAGES.violation.notAmongApprovers,
    cannotActFallback: 'لا يمكنك اتخاذ قرار على هذه المخالفة الآن.',
    notFound: 'لا يوجد إسناد موافقة لهذا النوع من المخالفات.',
  },
} as const;

export function approvalModeLabelAr(mode: keyof typeof AR_APPROVAL_MODE_LABELS): string {
  return AR_APPROVAL_MODE_LABELS[mode];
}

export function correctionRequestStatusLabelAr(
  status: keyof typeof AR_CORRECTION_REQUEST_STATUS_LABELS | string,
): string {
  if (status in AR_CORRECTION_REQUEST_STATUS_LABELS) {
    return AR_CORRECTION_REQUEST_STATUS_LABELS[status as keyof typeof AR_CORRECTION_REQUEST_STATUS_LABELS];
  }
  return AR_STATUS.rejected;
}

export function formalApproverStatusLabelAr(
  status: keyof typeof AR_FORMAL_APPROVAL_STATUS_LABELS,
): string {
  return AR_FORMAL_APPROVAL_STATUS_LABELS[status];
}
