export type VendorContact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  jobPosition?: string;
  type?: 'contact' | 'invoice' | 'delivery' | 'other';
};

export type Vendor = {
  id: string;
  type: 'person' | 'company'; // شخص | الشركة
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  taxId?: string; // معرّف الضريبة
  website?: string;
  tags?: string[];
  avatarColor?: string;

  // Stats / Smart Buttons
  billsCount: number; // الفواتير
  billedAmount: number; // مفوتر
  purchasesCount: number; // أوامر الشراء

  // Contacts
  contacts: VendorContact[];

  // Sales & Purchase Tab
  salesperson?: string; // مندوب المشتريات / المبيعات
  paymentTerms?: string; // شروط السداد
  paymentMethod?: string; // طريقة الدفع
  pricelist?: string; // قائمة الأسعار
  fiscalPosition?: string; // الوضع المالي
  customerLocation?: string; // موقع العميل
  vendorLocation?: string; // موقع المورد
  groupRfq?: string; // Group RFQ
  buyer?: string; // المشتري
  purchasePaymentTerms?: string;
  purchasePaymentMethod?: string;
  receiptReminder?: boolean; // تذكير الإيصال
  vendorCurrency?: string; // عملة المورد
  companyId?: string; // معرّف الشركة
  reference?: string; // الرقم المرجعي
  industry?: string; // مجال العمل

  // Accounting Tab
  bankAccounts?: string; // البنوك
  accountReceivable?: string; // حساب مدين
  accountPayable?: string; // حساب الدائن
  autoBillPosting?: string; // ترحيل فواتير المورّدين تلقائياً
  ignoreUnusualBillAmount?: boolean; // تجاهل مبلغ الفاتورة غير المعتاد
  ignoreUnusualBillDate?: boolean; // تجاهل تاريخ الفاتورة غير المعتاد
  invoiceSendingMethod?: string;
  electronicInvoiceFormat?: string;
  peppolId?: string;
  followupStatus?: string;
  followupReminderType?: 'auto' | 'manual';
  nextReminderDate?: string;
  responsibleUser?: string;

  // Notes Tab
  internalNotes?: string; // ملاحظات داخلية
};
