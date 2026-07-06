/** Coarse error categories used to decide UI treatment and retry advice — not tied to any UI framework. */
export const ERROR_CODES = {
  AUTH: 'AUTH',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  NETWORK: 'NETWORK',
  CHUNK_LOAD: 'CHUNK_LOAD',
  RENDER: 'RENDER',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

/** Whether a "retry" action is likely to succeed for this error category. */
export function isRetryableCode(code: ErrorCode): boolean {
  return code === 'NETWORK' || code === 'SERVER' || code === 'RENDER' || code === 'UNKNOWN';
}

/** Stale client bundle (post-deploy) — retry in place won't help, needs a hard reload. */
export function isChunkLoadCode(code: ErrorCode): boolean {
  return code === 'CHUNK_LOAD';
}
