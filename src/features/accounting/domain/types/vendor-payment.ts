export type VendorPaymentType = 'outbound'; // إرسال أموال (سداد للمورد)
export type VendorPaymentState = 'draft' | 'posted' | 'cancel' | 'in_process'; // مسودة | مرحل | ملغى | قيد المعالجة

export interface VendorPayment {
  id: string;
  name: string; // رقم سند الصرف (e.g. PAY/2024/00004 or مسودة)
  paymentType: VendorPaymentType;
  partnerId: string;
  partnerName: string; // اسم المورد
  recipientBankAccountId?: string; // الحساب البنكي للمستلم
  amount: number; // المبلغ المدفوع
  currency: string; // العملة (SAR)
  paymentDate: string; // تاريخ الدفعة
  memo?: string; // البيان / الملاحظة (e.g. سداد فاتورة مورد BILL/2024/00007)
  journalId: string; // دفتر اليومية (البنك أو الخزينة)
  journalName: string;
  paymentMethodLine: string; // طريقة الدفع (تحويل بنكي، شيك، نقدي)
  state: VendorPaymentState;
  matchedBillsCount?: number;
}
