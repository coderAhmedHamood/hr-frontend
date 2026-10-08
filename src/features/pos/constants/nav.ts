import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Clock,
  LayoutDashboard,
  MonitorSmartphone,
  ReceiptText,
  Settings,
  Undo2,
} from 'lucide-react';
import { posRoutes } from '@/features/pos/constants/routes';

export type PosNavItem = { labelAr: string; href: string; icon: LucideIcon };

export type PosNavGroup = {
  key: 'operations' | 'reports' | 'configuration';
  labelAr: string;
  icon: LucideIcon;
  items: PosNavItem[];
};

export const posOverviewItem: PosNavItem = {
  labelAr: 'نظرة عامة',
  href: posRoutes.overview,
  icon: LayoutDashboard,
};

export const posNavGroups: PosNavGroup[] = [
  {
    key: 'operations',
    labelAr: 'العمليات',
    icon: ReceiptText,
    items: [
      { labelAr: 'المبيعات', href: posRoutes.sales, icon: ReceiptText },
      { labelAr: 'المرتجعات', href: posRoutes.returns, icon: Undo2 },
      { labelAr: 'الورديات', href: posRoutes.sessions, icon: Clock },
    ],
  },
  {
    key: 'reports',
    labelAr: 'التقارير',
    icon: BarChart3,
    items: [{ labelAr: 'تقارير نقاط البيع', href: posRoutes.reports, icon: BarChart3 }],
  },
  {
    key: 'configuration',
    labelAr: 'التهيئة',
    icon: Settings,
    items: [
      { labelAr: 'نقاط البيع والأجهزة', href: posRoutes.registers, icon: MonitorSmartphone },
      { labelAr: 'الإعدادات', href: posRoutes.settings, icon: Settings },
    ],
  },
];

/** Admin routes of the app (the full-screen register is outside the ERP chrome). */
export function isPosAdminNavPath(pathname: string): boolean {
  if (pathname === posRoutes.register || pathname.startsWith(`${posRoutes.register}/`)) return false;
  return pathname === posRoutes.overview || pathname.startsWith(`${posRoutes.overview}/`);
}
