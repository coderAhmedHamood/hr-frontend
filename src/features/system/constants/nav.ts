import { LayoutDashboard } from 'lucide-react';

export const SYSTEM_APP_BASE = '/system' as const;

export const systemAppRoutes = {
  overview: SYSTEM_APP_BASE,
} as const;

export const systemOverviewItem = {
  labelAr: 'نظرة عامة',
  href: systemAppRoutes.overview,
  icon: LayoutDashboard,
} as const;

/** True for standalone System app routes under `/system`. */
export function isSystemAdminNavPath(pathname: string): boolean {
  return pathname === SYSTEM_APP_BASE || pathname.startsWith(`${SYSTEM_APP_BASE}/`);
}
