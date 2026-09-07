export type ProductType = 'consu' | 'service' | 'product'; // استهلاكي | خدمة | منتج قابل للتخزين

export interface AccountingProduct {
  id: string;
  name: string; // اسم المنتج (e.g. أجهزة نقاط البيع)
  canBeSold: boolean; // يمكن بيعه
  canBePurchased: boolean; // يمكن شراؤه
  type: ProductType; // نوع المنتج
  invoicingPolicy?: 'order' | 'delivery'; // سياسة الفوترة
  uom: string; // وحدة القياس (وحدة / ساعة / قطعة)
  purchaseUom?: string; // وحدة قياس الشراء
  salesPrice: number; // سعر البيع
  customerTaxes: string[]; // ضرائب العملاء (15%)
  cost: number; // التكلفة
  category: string; // فئة المنتج (e.g. All / خدمات / إلكترونيات)
  internalReference?: string; // المرجع الداخلي
  barcode?: string; // الباركود
  avatarColor?: string; // لون الصورة الرمزية
  productTag?: string; // علامة تصنيف المنتج

  // Accounting Tab
  incomeAccount?: string; // حساب الدخل (e.g. 400000 Product Sales)
  expenseAccount?: string; // حساب المصروفات (e.g. 600000 Expenses)
  priceDifferenceAccount?: string; // حساب فرق السعر

  // Stats / Smart Buttons
  salesCount?: number; // المبيعات
  purchasesCount?: number; // المشتريات
  onHandQty?: number; // في اليد (المخزون)
}
