import type { ChartAccount } from '@/features/accounting/domain/types/chart-account';

/** بيانات تجريبية — تُستبدل بنداء الـ API عند توفّر خدمة المحاسبة. */
export const MOCK_CHART_ACCOUNTS: ChartAccount[] = [
  { id: 'coa-1', code: '101100', nameAr: 'النقد في الصندوق', type: 'bank_cash', allowReconciliation: true, currencyCode: 'SAR' },
  { id: 'coa-2', code: '101200', nameAr: 'البنك — الحساب الجاري', type: 'bank_cash', allowReconciliation: true, currencyCode: 'SAR' },
  { id: 'coa-3', code: '101300', nameAr: 'البنك — حساب الدولار', type: 'bank_cash', allowReconciliation: true, currencyCode: 'USD' },
  { id: 'coa-4', code: '102100', nameAr: 'العملاء — المدينون التجاريون', type: 'receivable', allowReconciliation: true, currencyCode: 'SAR' },
  { id: 'coa-5', code: '103100', nameAr: 'المخزون', type: 'asset', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-6', code: '104100', nameAr: 'الأصول الثابتة', type: 'asset', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-7', code: '201100', nameAr: 'الموردون — الدائنون التجاريون', type: 'payable', allowReconciliation: true, currencyCode: 'SAR' },
  { id: 'coa-8', code: '202100', nameAr: 'ضريبة القيمة المضافة المستحقة', type: 'liability', allowReconciliation: true, currencyCode: 'SAR' },
  { id: 'coa-9', code: '203100', nameAr: 'رواتب مستحقة الدفع', type: 'liability', allowReconciliation: true, currencyCode: 'SAR' },
  { id: 'coa-10', code: '301100', nameAr: 'رأس المال', type: 'equity', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-11', code: '302100', nameAr: 'الأرباح المحتجزة', type: 'equity', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-12', code: '401100', nameAr: 'إيرادات المبيعات', type: 'revenue', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-13', code: '402100', nameAr: 'إيرادات الخدمات', type: 'revenue', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-14', code: '501100', nameAr: 'تكلفة المبيعات', type: 'expense', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-15', code: '502100', nameAr: 'مصروف الرواتب والأجور', type: 'expense', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-16', code: '503100', nameAr: 'مصروف الإيجار', type: 'expense', allowReconciliation: false, currencyCode: 'SAR' },
  { id: 'coa-17', code: '504100', nameAr: 'مصروفات بنكية وعمولات', type: 'expense', allowReconciliation: false, currencyCode: 'USD' },
];
