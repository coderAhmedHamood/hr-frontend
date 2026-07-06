import { extractApiErrorMessage } from '@/features/auth/lib/auth-api-messages';
import { ApiError } from '@/features/hr/lib/api/client';

const PENDING_CORRECTION_RE =
  /^Employee #[\w-]+ already has a pending correction request for (\d{4}-\d{2}-\d{2})$/;

const CORRECTION_MESSAGE_AR: Record<string, string> = {
  'decision is required (approve or reject)': 'يجب تحديد قرار الموافقة أو الرفض.',
};

export function isCorrectionRequestContext(context?: string): boolean {
  return Boolean(context?.startsWith('correction-requests'));
}

export function translateCorrectionRequestMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  const pendingMatch = trimmed.match(PENDING_CORRECTION_RE);
  if (pendingMatch) {
    return `يوجد طلب تصحيح حضور قيد الانتظار لهذا الموظف بتاريخ ${pendingMatch[1]}.`;
  }

  return CORRECTION_MESSAGE_AR[trimmed] ?? trimmed;
}

export function translateCorrectionRequestError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    const msg = error instanceof Error ? error.message : String(error);
    return translateCorrectionRequestMessage(msg);
  }

  const raw = extractApiErrorMessage(error.envelope, error.message);
  return translateCorrectionRequestMessage(raw);
}
