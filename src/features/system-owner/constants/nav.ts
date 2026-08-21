import { Building2, Inbox } from 'lucide-react';
import { SYSTEM_OWNER_BASE, systemOwnerRoutes } from '@/features/system-owner/constants/routes';

export const systemOwnerNavItems = [
  { labelAr: 'الشركات', href: systemOwnerRoutes.overview, icon: Building2 },
  { labelAr: 'طلبات التفعيل', href: systemOwnerRoutes.requests, icon: Inbox },
] as const;

export function isSystemOwnerNavPath(pathname: string): boolean {
  return pathname === SYSTEM_OWNER_BASE || pathname.startsWith(`${SYSTEM_OWNER_BASE}/`);
}
