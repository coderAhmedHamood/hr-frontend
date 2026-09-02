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
  Receipt,
  FileCheck,
  Building,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Layers,
  Globe,
} from 'lucide-react';
import { accountingRoutes } from '@/features/accounting/constants/routes';

export type AccountingNavItem = {
  labelAr: string;
  href: string;
  icon?: LucideIcon;
};

export type AccountingNavSection = {
  /** عنوان مجموعة اختياري داخل القائمة المنسدلة */
  labelAr?: string;
  items: AccountingNavItem[];
};

export type AccountingNavGroup = {
  key: 'configuration';
  labelAr: string;
  icon?: LucideIcon;
  sections: AccountingNavSection[];
};

export const accountingOverviewItem: AccountingNavItem = {
  labelAr: 'نظرة عامة',
  href: accountingRoutes.overview,
  icon: LayoutDashboard,
};

/** Top nav: نظرة عامة | الإعدادات (التهيئة) */
export const accountingNavGroups: AccountingNavGroup[] = [
  {
    key: 'configuration',
    labelAr: 'التهيئة',
    icon: Settings2,
    sections: [
      {
        labelAr: 'المحاسبة',
        items: [
          { labelAr: 'شجرة الحسابات', href: accountingRoutes.chartOfAccounts, icon: Network },
          { labelAr: 'الضرائب', href: accountingRoutes.taxes, icon: Percent },
          { labelAr: 'دفاتر اليومية', href: accountingRoutes.journals, icon: BookOpen },
          { labelAr: 'العملات', href: accountingRoutes.currencies, icon: Coins },
          { labelAr: 'الأوضاع المالية', href: accountingRoutes.fiscalPositions, icon: CalendarRange },
          { labelAr: 'دفتر الأستاذ المتعدد', href: accountingRoutes.ledgers, icon: CalendarDays },
          { labelAr: 'الفحوصات', href: accountingRoutes.periods, icon: FileCheck },
          { labelAr: 'نماذج الأصل', href: accountingRoutes.periods, icon: Layers },
          { labelAr: 'أنواع الإقرارات', href: accountingRoutes.periods, icon: FileText },
        ],
      },
      {
        labelAr: 'الفوترة',
        items: [
          { labelAr: 'شروط السداد', href: accountingRoutes.periods, icon: CreditCard },
          { labelAr: 'مستويات المتابعة', href: accountingRoutes.periods, icon: FileSpreadsheet },
          { labelAr: 'فئات المنتجات', href: accountingRoutes.periods, icon: Building },
          { labelAr: 'Intrastat رمز نظام', href: accountingRoutes.periods, icon: Globe },
        ],
      },
    ],
  },
];

export function flattenAccountingNavItems(group: AccountingNavGroup): AccountingNavItem[] {
  return group.sections.flatMap((section) => section.items);
}
