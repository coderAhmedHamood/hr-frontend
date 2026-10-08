/**
 * A request never waits forever: when the API stops answering, the screen
 * shows an error (and can retry) instead of an endless loader.
 */
export const API_REQUEST_TIMEOUT_MS = 45_000;

/** The caller's signal, also aborted after `API_REQUEST_TIMEOUT_MS`. */
export function withRequestTimeout(signal?: AbortSignal): AbortSignal | undefined {
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
    return signal;
  }
  const timeout = AbortSignal.timeout(API_REQUEST_TIMEOUT_MS);
  if (!signal) return timeout;
  return typeof AbortSignal.any === 'function' ? AbortSignal.any([signal, timeout]) : signal;
}
