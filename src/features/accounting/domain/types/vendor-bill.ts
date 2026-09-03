export type BillState = 'draft' | 'posted' | 'cancel'; // مسودة | مرحل | ملغى
export type BillPaymentState = 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'; // غير مدفوعة | في عملية الدفع | مدفوعة | مدفوعة جزئياً

export interface VendorBillLine {
  id: string;
  productId?: string;
  name: string; // المنتج / الوصف
  accountId: string; // الحساب (e.g. Expenses 600000)
  quantity: number; // الكمية
  uom?: string; // وحدة القياس
  priceUnit: number; // السعر
  taxes: string[]; // الضرائب (e.g. 15%)
  priceSubtotal: number; // المجموع الفرعي
}

export interface VendorBill {
  id: string;
  name: string; // رقم الفاتورة في النظام (e.g. BILL/2024/00006 or مسودة)
  vendorId: string;
  vendorName: string; // اسم المورد
  billReference?: string; // المرجع / رقم فاتورة المورد
  billDate: string; // تاريخ الفاتورة
  accountingDate?: string; // تاريخ المحاسبة
  dueDate: string; // تاريخ الاستحقاق / شروط السداد
  recipientBankAccountId?: string; // الحساب البنكي للمستلم
  journalId: string; // دفتر اليومية (المشتريات)
  journalName: string;
  currency: string; // العملة
  state: BillState;
  paymentState: BillPaymentState;
  lines: VendorBillLine[];
  amountUntaxed: number; // المبلغ غير شامل الضريبة
  amountTax: number; // الضريبة
  amountTotal: number; // الإجمالي
  amountDue: number; // المبلغ المستحق
  terms?: string; // الملاحظات والشروط
  fiscalPosition?: string; // الوضع المالي
  autoPostBill?: boolean;
}
