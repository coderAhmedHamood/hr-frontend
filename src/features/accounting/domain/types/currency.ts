export type CurrencySymbolPosition = 'before' | 'after';

export type CurrencyRate = {
  id: string;
  date: string; // e.g. "1 سبتمبر" or "2026-09-01"
  unitPerBase: number; // وحدة لكل YER e.g. 0.001886792453
  basePerUnit: number; // YER لكل وحدة e.g. 530.000000000001
};

export type Currency = {
  id: string;
  code: string; // e.g. "USD", "SAR", "YER"
  nameAr: string; // e.g. "United States dollar", "Saudi riyal"
  symbol: string; // e.g. "$", "SR", "ريال"
  currencyUnit?: string; // e.g. "دولار", "Rial"
  currencySubunit?: string; // e.g. "سنتات", "فلس"
  symbolPosition: CurrencySymbolPosition; // قبل المبلغ | بعد المبلغ
  active: boolean;
  isBaseCurrency?: boolean; // هل هي عملة الشركة الأساسية
  roundingFactor: number; // عامل التقريب e.g. 0.010000
  decimalPlaces: number; // الخانات العشرية e.g. 2
  rates: CurrencyRate[];
  lastUpdated?: string; // آخر تحديث
  unitPerBaseRate?: number; // قيمة وحدة لكل YER المعروضة في الجدول
};
