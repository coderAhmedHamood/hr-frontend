/** أنواع الحسابات في شجرة الحسابات. */
export const ACCOUNT_TYPES = [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
  'receivable',
  'payable',
  'bank_cash',
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type ChartAccount = {
  id: string;
  /** رمز الحساب */
  code: string;
  /** اسم الحساب */
  nameAr: string;
  /** النوع */
  type: AccountType;
  /** السماح بالتسوية — يسمح بمطابقة القيود المدينة والدائنة على الحساب */
  allowReconciliation: boolean;
  /** عملة الحساب — فارغة تعني عملة الشركة */
  currencyCode: string;
};

export const ACCOUNT_TYPE_LABEL_AR: Record<AccountType, string> = {
  asset: 'أصول',
  liability: 'التزامات',
  equity: 'حقوق الملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
  receivable: 'مدينون',
  payable: 'دائنون',
  bank_cash: 'بنك ونقد',
};

export const ACCOUNT_TYPE_OPTIONS = ACCOUNT_TYPES.map((value) => ({
  value,
  labelAr: ACCOUNT_TYPE_LABEL_AR[value],
}));

/** عملات الحسابات — تُستبدل بقائمة العملات المعتمدة للشركة عند توفّرها. */
export const ACCOUNT_CURRENCY_OPTIONS = [
  { value: 'SAR', labelAr: 'ريال سعودي (SAR)' },
  { value: 'USD', labelAr: 'دولار أمريكي (USD)' },
  { value: 'EUR', labelAr: 'يورو (EUR)' },
  { value: 'AED', labelAr: 'درهم إماراتي (AED)' },
] as const;
