export type AccountMapping = {
  id: string;
  originalAccount: string; // الحساب المعين للمنتج
  replacementAccount: string; // الحساب البديل
};

export type TaxMapping = {
  id: string;
  originalTax: string; // ضريبة المنتج
  replacementTax: string; // ضريبة الاستبدال
};

export type FiscalPosition = {
  id: string;
  name: string; // الوضع المالي (e.g. Domestic, Foreign Trade)
  autoDetect: boolean; // الكشف تلقائياً
  vatRequired: boolean; // مطلوب ضريبة القيمة المضافة
  foreignTaxId?: string; // معرّف الضريبة الأجنبية
  countryGroups?: string; // مجموعات الدول
  country?: string; // الدولة
  federalStates?: string; // الولايات الاتحادية
  zipFrom?: string; // نطاق الرمز البريدي - من
  zipTo?: string; // نطاق الرمز البريدي - إلى
  accountMappings: AccountMapping[]; // تخطيط الحسابات
  taxMappings: TaxMapping[]; // تخطيط الضرائب
};
