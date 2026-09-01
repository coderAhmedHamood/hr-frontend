import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Settings2,
  Network,
  BookOpen,
  CalendarRange,
  CalendarDays,
  Percent,
  Coins,
} from 'lucide-react';
import { accountingRoutes } from '@/features/accounting/constants/routes';

export type AccountingNavItem = {
  labelAr: string;
  href: string;
  icon: LucideIcon;
};

export type AccountingNavSection = {
  /** عنوان مجموعة اختياري داخل القائمة المنسدلة */
  labelAr?: string;
  items: AccountingNavItem[];
};

export type AccountingNavGroup = {
  key: 'configuration';
  labelAr: string;
  icon: LucideIcon;
  sections: AccountingNavSection[];
};

export const accountingOverviewItem: AccountingNavItem = {
  labelAr: 'نظرة عامة',
  href: accountingRoutes.overview,
  icon: LayoutDashboard,
};

/** Top nav: نظرة عامة | التهيئة */
export const accountingNavGroups: AccountingNavGroup[] = [
  {
    key: 'configuration',
    labelAr: 'التهيئة',
    icon: Settings2,
    sections: [
      {
        labelAr: 'الحسابات',
        items: [
          { labelAr: 'شجرة الحسابات', href: accountingRoutes.chartOfAccounts, icon: Network },
          { labelAr: 'دفاتر اليومية', href: accountingRoutes.journals, icon: BookOpen },
        ],
      },
      {
        labelAr: 'الفترات المالية',
        items: [
          { labelAr: 'السنوات المالية', href: accountingRoutes.fiscalYears, icon: CalendarRange },
          { labelAr: 'الفترات المحاسبية', href: accountingRoutes.periods, icon: CalendarDays },
        ],
      },
      {
        labelAr: 'عام',
        items: [
          { labelAr: 'الضرائب', href: accountingRoutes.taxes, icon: Percent },
          { labelAr: 'العملات', href: accountingRoutes.currencies, icon: Coins },
        ],
      },
    ],
  },
];

export function flattenAccountingNavItems(group: AccountingNavGroup): AccountingNavItem[] {
  return group.sections.flatMap((section) => section.items);
}
