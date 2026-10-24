import { SYSTEM_EMAIL_BASE } from '@/features/system/email/constants/routes';

export function isSystemEmailNavPath(pathname: string): boolean {
  return pathname === SYSTEM_EMAIL_BASE || pathname.startsWith(`${SYSTEM_EMAIL_BASE}/`);
}
