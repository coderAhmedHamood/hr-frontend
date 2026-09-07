export type PaymentType = 'inbound' | 'outbound'; // استلام أموال (عميل) | إرسال أموال (مورد)
export type PartnerType = 'customer' | 'supplier'; // عميل | مورد
export type PaymentState = 'draft' | 'posted' | 'cancel' | 'in_process'; // مسودة | مرحل | ملغى | قيد المعالجة

export interface CustomerPayment {
  id: string;
  name: string; // رقم الدفعة (e.g. CUST.IN/2024/00001 or مسودة)
  paymentType: PaymentType; // نوع الدفعة: تحصيل من عميل
  partnerType: PartnerType;
  partnerId: string;
  partnerName: string; // اسم العميل
  partnerBankAccountId?: string; // الحساب البنكي للمستلم
  amount: number; // المبلغ
  currency: string; // العملة (SAR)
  paymentDate: string; // تاريخ الدفعة
  memo?: string; // البيان / الملاحظة (e.g. سداد فاتورة INV/2024/00002)
  journalId: string; // دفتر اليومية (البنك أو النقدية)
  journalName: string;
  paymentMethodLine: string; // طريقة الدفع (يدوي، تحويل بنكي، سداد)
  state: PaymentState;
  matchedInvoicesCount?: number;
}
