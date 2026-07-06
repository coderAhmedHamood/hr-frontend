import { ERROR_CODES, type ErrorCode, type ErrorSeverity } from '@/shared/errors/error-codes';

export type NormalizedError = {
  code: ErrorCode;
  severity: ErrorSeverity;
  /** Backend/runtime message — safe to show to the user as-is (already Arabic where it comes from the API). */
  message: string;
  status: number | null;
  /** Next.js server-error correlation id, when present (set automatically for Server Component errors). */
  digest: string | null;
  cause: unknown;
};

/** Duck-typed check — avoids importing the `ApiError` class so this module stays dependency-free. */
function looksLikeApiError(error: unknown): error is { name: string; status: number; message: string } {
  return (
    !!error &&
    typeof error === 'object' &&
    (error as { name?: unknown }).name === 'ApiError' &&
    typeof (error as { status?: unknown }).status === 'number'
  );
}

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'ChunkLoadError' || /Loading chunk [\d\w]+ failed/i.test(error.message);
}

function codeFromApiStatus(status: number): ErrorCode {
  if (status === 0) return ERROR_CODES.NETWORK;
  if (status === 401) return ERROR_CODES.AUTH;
  if (status === 403) return ERROR_CODES.FORBIDDEN;
  if (status === 404) return ERROR_CODES.NOT_FOUND;
  if (status >= 500) return ERROR_CODES.SERVER;
  if (status >= 400) return ERROR_CODES.VALIDATION;
  return ERROR_CODES.UNKNOWN;
}

function severityFromCode(code: ErrorCode): ErrorSeverity {
  switch (code) {
    case ERROR_CODES.VALIDATION:
    case ERROR_CODES.NOT_FOUND:
      return 'warning';
    case ERROR_CODES.AUTH:
    case ERROR_CODES.FORBIDDEN:
      return 'info';
    case ERROR_CODES.SERVER:
    case ERROR_CODES.RENDER:
    case ERROR_CODES.UNKNOWN:
      return 'fatal';
    default:
      return 'error';
  }
}

/** Turns any thrown value — ApiError, Error, digest-bearing Next.js error, or arbitrary throw — into one shape. */
export function normalizeError(error: unknown, digest?: string | null): NormalizedError {
  if (looksLikeApiError(error)) {
    const code = codeFromApiStatus(error.status);
    return {
      code,
      severity: severityFromCode(code),
      message: error.message,
      status: error.status,
      digest: digest ?? null,
      cause: error,
    };
  }

  if (isChunkLoadError(error)) {
    return {
      code: ERROR_CODES.CHUNK_LOAD,
      severity: 'warning',
      message: 'تعذّر تحميل جزء من التطبيق — على الأغلب بسبب تحديث جديد.',
      status: null,
      digest: digest ?? null,
      cause: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: ERROR_CODES.RENDER,
      severity: 'fatal',
      message: error.message || 'حدث خطأ غير متوقع.',
      status: null,
      digest: digest ?? (error as Error & { digest?: string }).digest ?? null,
      cause: error,
    };
  }

  return {
    code: ERROR_CODES.UNKNOWN,
    severity: 'fatal',
    message: typeof error === 'string' ? error : 'حدث خطأ غير متوقع.',
    status: null,
    digest: digest ?? null,
    cause: error,
  };
}
