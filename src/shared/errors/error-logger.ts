import { toast } from 'sonner';
import { publicConfig } from '@/shared/config';
import type { NormalizedError } from '@/shared/errors/normalize-error';

function isDevEnv(): boolean {
  const env = publicConfig.appEnv.toLowerCase();
  return env === '' || env === 'development' || env === 'dev' || env === 'local';
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ErrorLogEntry = {
  correlationId: string;
  timestamp: string;
  context?: string;
  error: NormalizedError;
};

export type ErrorLogOptions = {
  /** When true, skip toast — use when the caller already surfaced the message. */
  skipToast?: boolean;
};

/**
 * Single sink for all error logging. Surfaces failures via toast in the browser;
 * swap the `// TODO Sentry` block for `Sentry.captureException` once the SDK is added.
 */
export function logError(error: NormalizedError, context?: string, options?: ErrorLogOptions): ErrorLogEntry {
  const entry: ErrorLogEntry = {
    correlationId: error.digest ?? generateCorrelationId(),
    timestamp: new Date().toISOString(),
    context,
    error,
  };

  if (!options?.skipToast && typeof window !== 'undefined') {
    const toastMessage = isDevEnv() && context
      ? `${error.message} (${context})`
      : error.message;
    toast.error(toastMessage);
  }

  // TODO Sentry: Sentry.captureException(error.cause, { tags: { code: error.code, context }, fingerprint: [entry.correlationId] });

  return entry;
}
