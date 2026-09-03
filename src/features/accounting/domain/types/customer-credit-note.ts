export type CreditNoteState = 'draft' | 'posted' | 'cancel'; // مسودة | مرحل | ملغى
export type CreditNotePaymentState = 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'; // غير مدفوعة | في عملية الدفع | مدفوعة | مدفوعة جزئياً

export interface CreditNoteLine {
  id: string;
  productId?: string;
  name: string; // الوصف / البند المرتجع
  accountId: string; // الحساب (e.g. Product Sales 400000)
  quantity: number; // الكمية المرتجعة
  uom?: string; // وحدة القياس
  priceUnit: number; // السعر
  taxes: string[]; // الضرائب (e.g. 15%)
  priceSubtotal: number; // المجموع الفرعي
}

export interface CustomerCreditNote {
  id: string;
  name: string; // رقم الإشعار الدائن (e.g. RINV/2024/00004 or مسودة)
  customerId: string;
  customerName: string;
  creditNoteDate: string; // تاريخ الإشعار الدائن
  dueDate: string; // تاريخ الاستحقاق
  reason?: string; // سبب الرد / الإشعار الدائن
  paymentReference?: string; // مرجع الدفع
  originalInvoiceId?: string; // الفاتورة الأصلية
  originalInvoiceName?: string;
  journalId: string; // دفتر اليومية (المبيعات)
  journalName: string;
  currency: string; // العملة
  state: CreditNoteState;
  paymentState: CreditNotePaymentState;
  lines: CreditNoteLine[];
  amountUntaxed: number; // المبلغ غير شامل الضريبة
  amountTax: number; // الضريبة
  amountTotal: number; // الإجمالي
  amountDue: number; // المبلغ المستحق
  terms?: string; // الشروط والملاحظات
  salesperson?: string; // مندوب المبيعات
  fiscalPosition?: string; // الوضع المالي
  electronicInvoiceStatus?: 'signed' | 'sent' | 'pending';
}
