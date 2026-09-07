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
  Users,
  Truck,
  Package,
  RotateCcw,
  ListOrdered,
  FileStack,
  CheckSquare,
  BarChart3,
  TrendingUp,
  Scale,
  DollarSign,
  PieChart,
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
  key: string;
  labelAr: string;
  icon?: LucideIcon;
  sections: AccountingNavSection[];
};

/** لوحة البيانات */
export const accountingOverviewItem: AccountingNavItem = {
  labelAr: 'لوحة البيانات',
  href: accountingRoutes.overview,
  icon: LayoutDashboard,
};

/**
 * شريط التنقل العلوي للمحاسبة:
 * لوحة البيانات | العملاء | الموردين | المحاسبة | مراجعة | إعداد التقارير | التهيئة
 */
export const accountingNavGroups: AccountingNavGroup[] = [
  {
    key: 'customers',
    labelAr: 'العملاء',
    icon: Users,
    sections: [
      {
        items: [
          { labelAr: 'الفواتير', href: accountingRoutes.customerInvoices, icon: FileText },
          { labelAr: 'إشعارات الدائن', href: accountingRoutes.customerCreditNotes, icon: Receipt },
          { labelAr: 'المدفوعات', href: accountingRoutes.customerPayments, icon: CreditCard },
          { labelAr: 'المنتجات', href: accountingRoutes.customerProducts, icon: Package },
          { labelAr: 'العملاء', href: accountingRoutes.customers, icon: Users },
        ],
      },
    ],
  },
  {
    key: 'vendors',
    labelAr: 'الموردين',
    icon: Truck,
    sections: [
      {
        items: [
          { labelAr: 'الفواتير', href: accountingRoutes.vendorBills, icon: FileSpreadsheet },
          { labelAr: 'إشعارات المدين', href: accountingRoutes.vendorRefunds, icon: RotateCcw },
          { labelAr: 'الدفعات', href: accountingRoutes.vendorPayments, icon: CreditCard },
          { labelAr: 'المنتجات', href: accountingRoutes.vendorProducts, icon: Package },
          { labelAr: 'الموردين', href: accountingRoutes.vendors, icon: Building },
        ],
      },
    ],
  },
  {
    key: 'accounting_actions',
    labelAr: 'المحاسبة',
    icon: BookOpen,
    sections: [
      {
        items: [
          { labelAr: 'قيود اليومية', href: accountingRoutes.journalEntries, icon: ListOrdered },
          { labelAr: 'عناصر اليومية', href: accountingRoutes.journalItems, icon: FileStack },
          { labelAr: 'دفتر الأستاذ العام', href: accountingRoutes.generalLedger, icon: BookOpen },
          { labelAr: 'دفتر أستاذ الشريك', href: accountingRoutes.partnerLedger, icon: Users },
          { labelAr: 'التسوية', href: accountingRoutes.reconciliation, icon: CheckSquare },
        ],
      },
    ],
  },
  {
    key: 'review',
    labelAr: 'مراجعة',
    icon: CheckSquare,
    sections: [
      {
        items: [
          { labelAr: 'تسوية الحسابات', href: accountingRoutes.reviewReconciliation, icon: CheckSquare },
          { labelAr: 'مراجعة القيود', href: accountingRoutes.reviewEntries, icon: FileText },
        ],
      },
    ],
  },
  {
    key: 'reporting',
    labelAr: 'إعداد التقارير',
    icon: BarChart3,
    sections: [
      {
        labelAr: 'البيانات المالية',
        items: [
          { labelAr: 'الأرباح والخسائر', href: accountingRoutes.profitAndLoss, icon: TrendingUp },
          { labelAr: 'الميزانية العمومية', href: accountingRoutes.balanceSheet, icon: Scale },
          { labelAr: 'بيان التدفقات النقدية', href: accountingRoutes.cashFlow, icon: DollarSign },
        ],
      },
      {
        labelAr: 'تقارير الشركاء والضرائب',
        items: [
          { labelAr: 'تقرير الضرائب', href: accountingRoutes.taxReport, icon: Percent },
          { labelAr: 'ميزان المراجعة', href: accountingRoutes.trialBalance, icon: FileSpreadsheet },
          { labelAr: 'أعمار ديون العملاء', href: accountingRoutes.agedReceivables, icon: PieChart },
          { labelAr: 'أعمار ديون الموردين', href: accountingRoutes.agedPayables, icon: PieChart },
        ],
      },
    ],
  },
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
