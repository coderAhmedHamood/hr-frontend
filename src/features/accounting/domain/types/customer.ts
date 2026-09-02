export type CustomerContact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  jobPosition?: string;
  type?: 'contact' | 'invoice' | 'delivery' | 'other';
};

export type Customer = {
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
  taxId?: string; // معرّف الضريبة (e.g. غير منطبق)
  website?: string;
  tags?: string[];
  avatarColor?: string;

  // Stats / Smart Buttons
  salesCount: number; // المبيعات
  invoicedAmount: number; // مفوتر
  purchasesCount: number; // المشتريات

  // Contacts
  contacts: CustomerContact[];

  // Sales & Purchase Tab
  salesperson?: string; // مندوب المبيعات
  paymentTerms?: string; // شروط السداد
  paymentMethod?: string; // طريقة الدفع
  pricelist?: string; // قائمة الأسعار (e.g. افتراضي (YER))
  fiscalPosition?: string; // الوضع المالي
  customerLocation?: string; // موقع العميل (e.g. Customers)
  vendorLocation?: string; // موقع المورد (e.g. Vendors)
  groupRfq?: string; // Group RFQ (e.g. On Order)
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
  accountReceivable?: string; // حساب مدين (e.g. Account Receivable 121000)
  accountPayable?: string; // حساب الدائن (e.g. Account Payable 211000)
  autoBillPosting?: string; // ترحيل فواتير المورّدين تلقائياً
  ignoreUnusualBillAmount?: boolean; // تجاهل مبلغ الفاتورة غير المعتاد
  ignoreUnusualBillDate?: boolean; // تجاهل تاريخ الفاتورة غير المعتاد
  invoiceSendingMethod?: string; // جاري إرسال الفاتورة
  electronicInvoiceFormat?: string; // تنسيق الفاتورة الإلكترونية
  peppolId?: string;
  followupStatus?: string; // حالة المتابعة (e.g. لا حاجة لاتخاذ إجراء)
  followupReminderType?: 'auto' | 'manual'; // التذكيرات: تلقائي | يدوي
  nextReminderDate?: string; // التذكير التالي
  responsibleUser?: string; // المسؤول

  // Notes Tab
  internalNotes?: string; // ملاحظات داخلية
};
