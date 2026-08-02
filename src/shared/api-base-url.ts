import { publicConfig } from '@/shared/config';

/** Same-origin API base used by fetch (handles LAN / proxy in production). */
export function resolveApiBaseUrl(configuredUrl = publicConfig.apiUrl): string {
  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const currentHost = window.location.hostname;
  const isLoopbackHost =
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    currentHost === '::1';
  // Android emulator reaches the host machine via 10.0.2.2 — never call
  // `localhost` from that WebView (that would be the emulator itself).
  if (currentHost === '10.0.2.2') {
    try {
      const apiHost = new URL(configuredUrl, window.location.origin).hostname;
      const apiIsLoopback =
        apiHost === 'localhost' || apiHost === '127.0.0.1' || apiHost === '::1';
      if (apiIsLoopback || configuredUrl.startsWith('/')) {
        return configuredUrl.startsWith('/') ? configuredUrl : '/api-backend';
      }
      return configuredUrl;
    } catch {
      return '/api-backend';
    }
  }
  if (isLoopbackHost) {
    return configuredUrl;
  }

  try {
    const apiHost = new URL(configuredUrl, window.location.origin).hostname;
    const isLocalApi = apiHost === 'localhost' || apiHost === '127.0.0.1' || apiHost === '::1';
    if (isLocalApi) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[api-base-url] NEXT_PUBLIC_API_URL points to a localhost address (${configuredUrl}) but the page is served from ${currentHost}. Falling back to /api-backend. If API calls are failing, check your next.config.js rewrites.`,
        );
      }
      return '/api-backend';
    }
    return configuredUrl;
  } catch {
    return configuredUrl;
  }
}
