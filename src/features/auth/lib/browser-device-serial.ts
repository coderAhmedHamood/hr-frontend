import { randomUUID } from '@/shared/utils';

const STORAGE_KEY = 'hr-web-device-serial-v1';

/**
 * Stable browser/device serial for web admin login (`mobileSerialNumber` + `loginChannel: web`).
 * Persisted in localStorage so the same browser keeps the same bind.
 */
export function getOrCreateBrowserDeviceSerial(): string {
  if (typeof window === 'undefined') {
    return randomUUID().replace(/-/g, '').toUpperCase();
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (existing) return existing;

    const created = randomUUID().replace(/-/g, '').toUpperCase();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return randomUUID().replace(/-/g, '').toUpperCase();
  }
}
