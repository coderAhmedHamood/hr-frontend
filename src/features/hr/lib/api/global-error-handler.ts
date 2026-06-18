import { publicConfig } from '@/shared/config';
import { ApiError } from '@/features/hr/lib/api/client';
import type { ApiErrorEnvelope } from '@/features/hr/lib/api/types';
import { isApiErrorEnvelope } from '@/features/hr/lib/api/types';
import { toast } from 'sonner';
import { duplicateAdvanceNumberMessage, isDuplicateAdvanceNumberError } from '@/features/hr/contracts/lib/employee-advance-errors';

export type ApiErrorHandleResult = {
  /** Human-readable backend message for toasts and inline UI. */
  displayMessage: string;
  /** Full backend envelope JSON (dev console / debug panels only). */
  debugPayload: string | null;
  envelope: ApiErrorEnvelope | null;
  status: number;
};

function isDevEnv() {
  const env = publicConfig.appEnv.toLowerCase();
  return env === '' || env === 'development' || env === 'dev' || env === 'local';
}

/** Pretty-print exact backend body for UI + console (dev-friendly debugging). */
export function formatApiErrorForDisplay(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.envelope) {
      return JSON.stringify(error.envelope, null, 2);
    }
    if (error.payload) {
      return JSON.stringify(error.payload, null, 2);
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function logApiError(error: ApiError, context?: string) {
  const label = context ? `[API Error] ${context}` : '[API Error]';
  console.error(label, formatApiErrorForDisplay(error));
}

/**
 * Single entry for API failures. Logs full backend envelope, applies status rules,
 * optional toast. Returns backend-shaped message for UI (never a generic Arabic override).
 */
export function handleApiError(error: unknown, context?: string): ApiErrorHandleResult {
  if (!(error instanceof ApiError)) {
    const displayMessage = error instanceof Error ? error.message : String(error);
    console.error(context ? `[API Error] ${context}` : '[API Error]', error);
    return { displayMessage, debugPayload: null, envelope: null, status: 0 };
  }

  logApiError(error, context);

  const envelope = error.envelope;
  const status = error.status;

  if (status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login';
  } else if (status === 403) {
    toast.error(envelope?.message ?? 'غير مصرح');
  } else if (status >= 500) {
    const toastMessage = isDuplicateAdvanceNumberError(error)
      ? duplicateAdvanceNumberMessage()
      : (envelope?.message ?? 'خطأ في الخادم');
    toast.error(toastMessage);
  }

  const displayMessage = isDuplicateAdvanceNumberError(error)
    ? duplicateAdvanceNumberMessage()
    : (envelope?.message?.trim() || error.message);
  const debugPayload = isDevEnv() ? formatApiErrorForDisplay(error) : null;

  return { displayMessage, debugPayload, envelope, status };
}

export function toApiErrorEnvelope(payload: unknown, status: number, fallbackMessage: string): ApiErrorEnvelope {
  if (isApiErrorEnvelope(payload)) {
    return payload;
  }
  return {
    status,
    message: fallbackMessage,
    data: null,
    error: payload,
  };
}
