export type InvoiceState = 'draft' | 'posted' | 'cancel'; // مسودة | مرحل | ملغى
export type PaymentState = 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed'; // غير مدفوعة | في عملية الدفع | مدفوعة | مدفوعة جزئياً

export interface InvoiceLine {
  id: string;
  productId?: string;
  name: string; // الوصف / المنتج
  accountId: string; // الحساب (e.g. Product Sales 400000)
  quantity: number; // الكمية
  uom?: string; // وحدة القياس
  priceUnit: number; // السعر
  taxes: string[]; // الضرائب (e.g. 15%)
  priceSubtotal: number; // المجموع الفرعي
}

export interface CustomerInvoice {
  id: string;
  name: string; // رقم الفاتورة (e.g. INV/2024/00003 or مسودة)
  customerId: string;
  customerName: string;
  invoiceDate: string; // تاريخ الفاتورة
  dueDate: string; // تاريخ الاستحقاق / شروط السداد
  deliveryDate?: string; // تاريخ التوصيل
  paymentReference?: string; // مرجع الدفع
  journalId: string; // دفتر اليومية (المبيعات)
  journalName: string;
  currency: string; // العملة (e.g. SAR / YER)
  state: InvoiceState;
  paymentState: PaymentState;
  lines: InvoiceLine[];
  amountUntaxed: number; // المبلغ غير شامل الضريبة
  amountTax: number; // الضريبة
  amountTotal: number; // الإجمالي
  amountDue: number; // المبلغ المستحق
  terms?: string; // الشروط والأحكام
  salesperson?: string; // مندوب المبيعات
  fiscalPosition?: string; // الوضع المالي
  cashBasisAccounting?: boolean; // محاسبة على الأساس النقدي
  electronicInvoiceStatus?: 'signed' | 'sent' | 'pending';
}
