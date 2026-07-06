import type { LucideIcon } from 'lucide-react';
import {
  CalendarRange,
  UserCheck,
  Receipt,
} from 'lucide-react';
import { hrPayrollSectionHref } from '@/features/hr/payroll/constants/routes';

export type HRPayrollNavItem = {
  slug: string;
  labelAr: string;
  icon: LucideIcon;
};

export type HRPayrollNavGroup = {
  labelAr: string;
  items: HRPayrollNavItem[];
};

export const hrPayrollNavGroups: HRPayrollNavGroup[] = [
  {
    labelAr: 'الراتب',
    items: [
      { slug: 'payroll-periods', labelAr: 'فترات الراتب', icon: CalendarRange },
      { slug: 'monthly-inputs', labelAr: 'مدخلات الرواتب', icon: Receipt },
    ],
  },
  {
    labelAr: 'التقارير',
    items: [
      { slug: 'payroll-salary-approvals', labelAr: 'كشف مسيرات الرواتب', icon: UserCheck },
    ],
  },
];

const PAYROLL_SLUGS = new Set(
  hrPayrollNavGroups.flatMap((g) => g.items.map((i) => i.slug)),
);

/** مسارات `/hr/payroll` بما فيها `/hr/payroll/period/…` */
export function isHrPayrollNavPath(pathname: string): boolean {
  if (pathname.startsWith('/hr/payroll/period')) return true;
  const segment = pathname.replace(/^\/hr\/payroll\/?/, '').split('/')[0]?.split('?')[0];
  return segment != null && PAYROLL_SLUGS.has(segment);
}

export function hrPayrollNavHref(slug: string): string {
  return hrPayrollSectionHref(slug);
}
