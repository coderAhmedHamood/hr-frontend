import { publicConfig } from '@/shared/config';
import {
  extractApiErrorMessage,
  isAuthApiContext,
  resolveAuthDisplayMessage,
} from '@/features/auth/lib/auth-api-messages';
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

/**
 * Single entry for API failures. Shows toast, applies status rules.
 * Returns backend-shaped message for UI (never a generic Arabic override).
 */
export function handleApiError(
  error: unknown,
  context?: string,
  options?: { suppressRedirect?: boolean },
): ApiErrorHandleResult {
  if (!(error instanceof ApiError)) {
    const displayMessage = error instanceof Error ? error.message : String(error);
    toast.error(displayMessage);
    return { displayMessage, debugPayload: null, envelope: null, status: 0 };
  }

  const envelope = error.envelope;
  const status = error.status;

  const rawMessage = isDuplicateAdvanceNumberError(error)
    ? duplicateAdvanceNumberMessage()
    : extractApiErrorMessage(envelope, error.message);

  const displayMessage = status === 403
    ? 'ليس لديك صلاحية للوصول إلى هذا المورد'
    : isDuplicateAdvanceNumberError(error)
      ? rawMessage
      : resolveAuthDisplayMessage(rawMessage, context);

  const authContext = isAuthApiContext(context);
  const suppressRedirect = Boolean(options?.suppressRedirect);

  if (status === 401 && typeof window !== 'undefined' && !suppressRedirect) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?returnTo=${returnTo}`);
  } else {
    const skipToast = status === 401 && suppressRedirect && !authContext;
    if (!skipToast) {
      toast.error(displayMessage);
    }
  }
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
