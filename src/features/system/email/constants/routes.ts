export const SYSTEM_EMAIL_BASE = '/system/email' as const;

export function systemEmailHref(): string {
  return SYSTEM_EMAIL_BASE;
}
