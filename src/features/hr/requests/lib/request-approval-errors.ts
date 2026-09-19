const NO_APPROVERS_RE =
  /^No active approval assignment with approvers found for request type "([^"]+)"/;

const NO_SALARY_ADVANCE_APPROVERS =
  'No active approval assignment with approvers found for salary-advance request type';

const OFFICIAL_SLUG_HINTS: Record<string, string> = {
  'leave-request': 'طلب إجازة',
  'attendance-correction': 'تصحيح حضور',
  'salary-advance': 'سلفة راتب',
  'overtime-request': 'عمل إضافي',
};

/**
 * Maps backend approval-config guard messages to actionable Arabic copy.
 */
export function translateRequestApprovalMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(NO_SALARY_ADVANCE_APPROVERS)) {
    return (
      'لا يوجد مسار موافقة نشط لنوع الطلب الرسمي «سلفة راتب» (salary-advance) مع معتمد واحد على الأقل. ' +
      'من الطلبات → إسناد الموافقة: اربط نوع «سلفة راتب» بقالب موافقة واختر المعتمدين.'
    );
  }

  const match = trimmed.match(NO_APPROVERS_RE);
  if (match) {
    const slug = match[1];
    const label = OFFICIAL_SLUG_HINTS[slug] ?? slug;
    return (
      `لا يوجد مسار موافقة نشط لنوع الطلب «${label}» (${slug}) مع معتمد واحد على الأقل. ` +
      'من الطلبات → إسناد الموافقة: اربط هذا النوع بقالب موافقة واختر المعتمدين.'
    );
  }

  if (/no active approval assignment/i.test(trimmed) && /approvers/i.test(trimmed)) {
    return (
      'لا يوجد إسناد موافقة نشط مع معتمدين لهذا الطلب. ' +
      'من الطلبات → إسناد الموافقة: أنشئ أو عدّل قالباً، اربط نوع الطلب، وأضف معتمدين.'
    );
  }

  return null;
}
