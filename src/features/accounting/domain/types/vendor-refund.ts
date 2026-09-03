export type VendorRefundState = 'draft' | 'posted' | 'cancel'; // مسودة | مرحل | ملغى
export type VendorRefundPaymentState = 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'; // غير مدفوعة | في عملية الدفع | مدفوعة | مدفوعة جزئياً

export interface VendorRefundLine {
  id: string;
  productId?: string;
  name: string; // المنتج / الوصف المرتجع
  accountId: string; // الحساب (e.g. Expenses 600000)
  quantity: number; // الكمية المرتجعة
  uom?: string; // وحدة القياس
  priceUnit: number; // السعر
  taxes: string[]; // الضرائب (e.g. 15%)
  priceSubtotal: number; // المجموع الفرعي
}

export interface VendorRefund {
  id: string;
  name: string; // رقم إشعار المدين في النظام (e.g. RBILL/2024/00007 or مسودة)
  vendorId: string;
  vendorName: string; // اسم المورد
  refundReference?: string; // المرجع / رقم إشعار المورد
  refundDate: string; // تاريخ إشعار المدين
  accountingDate?: string; // تاريخ المحاسبة
  dueDate: string; // تاريخ الاستحقاق
  originalBillName?: string; // الفاتورة الأصلية
  journalId: string; // دفتر اليومية (المشتريات)
  journalName: string;
  currency: string; // العملة
  state: VendorRefundState;
  paymentState: VendorRefundPaymentState;
  lines: VendorRefundLine[];
  amountUntaxed: number; // المبلغ غير شامل الضريبة
  amountTax: number; // الضريبة
  amountTotal: number; // الإجمالي
  amountDue: number; // المبلغ المستحق
  reason?: string; // سبب إصدار إشعار المدين
  terms?: string; // الملاحظات والشروط
  fiscalPosition?: string; // الوضع المالي
}
