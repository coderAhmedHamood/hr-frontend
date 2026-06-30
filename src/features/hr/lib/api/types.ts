/** Matches backend `ApiSuccessEnvelope` / `ApiErrorEnvelope` (see backend API_CONTRACT.md). */

export type ApiSuccessEnvelope<T = unknown> = {
  status: number;
  message: string;
  data: T;
  error: null;
};

export type ApiErrorEnvelope = {
  status: number;
  message: string;
  data: null;
  error: unknown;
};

export function isApiErrorEnvelope(payload: unknown): payload is ApiErrorEnvelope {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as Record<string, unknown>;
  return record.data === null && 'status' in record && 'message' in record && 'error' in record && record.error !== undefined;
}

export function isApiSuccessEnvelope(payload: unknown): payload is ApiSuccessEnvelope {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as Record<string, unknown>;
  const status = record.status;
  const hasOkStatus = typeof status === 'number' && status >= 200 && status < 300;
  const hasData = 'data' in record && record.data !== null && record.data !== undefined;
  const hasNoError = record.error === null || record.error === undefined;
  return hasOkStatus && hasData && hasNoError;
}
