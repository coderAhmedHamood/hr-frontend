export type FixedAssetState = 'draft' | 'running' | 'cancel';

export type DepreciationMethod = 'linear' | 'degressive' | 'accelerated';

export interface DepreciationLine {
  id: string;
  date: string; // تاريخ الإهلاك (e.g. "31 ديسمبر 2024")
  reference: string; // الرقم المرجعي (e.g. "كمبيوتر محمول: الإهلاك")
  depreciation: number; // إهلاك (e.g. 38,000.00)
  cumulativeDepreciation: number; // الإهلاك التراكمي (e.g. 38,000.00)
  depreciableValue: number; // القيمة القابلة للإهلاك المتبقية (e.g. 152,000.00)
  journalEntryName?: string; // قيد اليومية (e.g. "المتف/2024/12/0001" or "/")
  journalEntryId?: string;
}

export interface FixedAssetInvoiceLine {
  id: string;
  date: string; // التاريخ
  journalEntryName: string; // قيد اليومية
  accountId: string; // الحساب
  name: string; // بطاقة عنوان
  debit: number; // المدين
  credit: number; // الدائن
}

export interface FixedAsset {
  id: string;
  name: string; // اسم الأصل (e.g. "كمبيوتر محمول")
  state: FixedAssetState; // مسودة | جاري | ملغى

  // قيم الأصول
  originalValue: number; // القيمة الأصلية (e.g. 250,000.00)
  acquisitionDate: string; // تاريخ الاستحواذ (e.g. "2024-01-01" / "1 يناير 2024")
  assetModel?: string; // نموذج الأصل (e.g. "مجموعة الأصول")

  // القيم الحالية
  nonDepreciableValue: number; // ليست قيمة قابلة للإهلاك (e.g. 60,000.00)
  bookValue: number; // القيمة الدفترية (e.g. 174,000.00)
  depreciableValue: number; // قابل للإهلاك (e.g. 114,000.00)

  // طريقة الإهلاك
  method: string; // الطريقة (e.g. "خط مستقيم")
  durationYears: number; // المدة بالسنوات (e.g. 5)
  calculationMethod: string; // احتساب (e.g. "فترات ثابتة")
  prorataDate?: string; // التاريخ النسبي (e.g. "2024-01-01")

  // المحاسبة
  fixedAssetAccount: string; // حساب الأصل الثابت (e.g. "151000 الأصول الثابتة")
  depreciationAccount: string; // حساب الإهلاك (e.g. "151000 الأصول الثابتة")
  expenseAccount: string; // حساب النفقات (e.g. "600000 النفقات")
  journalName: string; // دفتر اليومية (e.g. "عمليات متنوعة")

  // القيمة عند الاسترداد
  salvageValue: number; // المبلغ المُهلك / الخردة (e.g. 0.00)

  // الجداول الفرعية
  depreciationLines: DepreciationLine[]; // اللائحة الاستهلاكية
  invoices: FixedAssetInvoiceLine[]; // الفواتير
}
