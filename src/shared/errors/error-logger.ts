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

/**
 * Single sink for all error logging. Dev: full console trace. Prod: one structured
 * console line (safe for log aggregators) — swap the `// TODO Sentry` block for
 * `Sentry.captureException` once the SDK is added; call sites never change.
 */
export function logError(error: NormalizedError, context?: string): ErrorLogEntry {
  const entry: ErrorLogEntry = {
    correlationId: error.digest ?? generateCorrelationId(),
    timestamp: new Date().toISOString(),
    context,
    error,
  };

  if (isDevEnv()) {
    console.error(
      `[error:${entry.correlationId}]${context ? ` (${context})` : ''} ${error.code} — ${error.message}`,
      error.cause,
    );
    return entry;
  }

  // Production: no stack traces, no raw `cause` in the console — just the structured summary.
  console.error(`[error:${entry.correlationId}] ${error.code}${context ? ` (${context})` : ''}`);

  // TODO Sentry: Sentry.captureException(error.cause, { tags: { code: error.code, context }, fingerprint: [entry.correlationId] });

  return entry;
}
