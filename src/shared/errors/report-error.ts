import { normalizeError, type NormalizedError } from '@/shared/errors/normalize-error';
import { logError, type ErrorLogEntry, type ErrorLogOptions } from '@/shared/errors/error-logger';

/**
 * Normalize + log a crash-class error (render exceptions, route errors, global crashes).
 *
 * Not for API errors — those already show a toast via `handleApiError()`; calling this
 * from a component would double-report the same failure. `handleApiError` calls this
 * itself for 5xx responses only, to get them into the same logging pipeline without a
 * second toast.
 */
export function reportError(
  error: unknown,
  context?: string,
  digest?: string | null,
  options?: ErrorLogOptions,
): {
  normalized: NormalizedError;
  logEntry: ErrorLogEntry;
} {
  const normalized = normalizeError(error, digest);
  const logEntry = logError(normalized, context, options);
  return { normalized, logEntry };
}
