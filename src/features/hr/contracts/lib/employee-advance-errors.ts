import { ApiError } from '@/features/hr/lib/api/client';

const DUPLICATE_ADVANCE_CONSTRAINT = 'uq_employee_advance_number_per_company';

export function isDuplicateAdvanceNumberError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const haystack = [
    error.envelope?.message,
    error.message,
    typeof error.envelope?.error === 'object' && error.envelope.error !== null
      ? (error.envelope.error as { message?: string }).message
      : undefined,
    JSON.stringify(error.envelope?.error ?? ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(DUPLICATE_ADVANCE_CONSTRAINT)
    || (haystack.includes('duplicate key') && haystack.includes('advance'));
}

export function duplicateAdvanceNumberMessage(): string {
  return 'تعذّر إنشاء السلفة: رقم السلفة مستخدم مسبقاً لهذه الشركة. حاول مرة أخرى بعد لحظات.';
}
