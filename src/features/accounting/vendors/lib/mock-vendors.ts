import type { Vendor } from '@/features/accounting/domain/types/vendor';

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'vend-1',
    type: 'company',
    name: 'شركة الأمل للتوريدات والتجارة',
    email: 'contact@alamal-supplies.com',
    phone: '+967 1 234567',
    street: 'شارع الزبيري',
    street2: 'المبنى التجاري - الدور الثاني',
    city: 'صنعاء',
    state: 'صنعاء',
    zip: '12345',
    country: 'اليمن',
    taxId: '300123456789',
    website: 'https://alamal-supplies.com',
    tags: ['مورد معتمد', 'استيراد'],
    avatarColor: '#0284c7', // Blue / Cyan
    billsCount: 2,
    billedAmount: 45000.0,
    purchasesCount: 5,
    contacts: [
      {
        id: 'vc-1',
        name: 'أحمد سعيد - مدير المبيعات',
        email: 'ahmed@alamal-supplies.com',
        phone: '+967 771234567',
        jobPosition: 'مدير المبيعات والتوزيع',
        type: 'contact',
      },
    ],

    // Sales & Purchase
    pricelist: 'افتراضي (YER)',
    customerLocation: 'Customers',
    vendorLocation: 'Vendors',
    groupRfq: 'On Order',
    purchasePaymentTerms: '30 يوماً',
    purchasePaymentMethod: 'تحويل بنكي',
    receiptReminder: true,
    vendorCurrency: 'YER',
    industry: 'تجارة وتوريدات عامة',

    // Accounting
    accountReceivable: 'Account Receivable 121000',
    accountPayable: 'Account Payable 211000',
    autoBillPosting: 'السؤال بعد 3 عمليات تصديق دون تعديلات',
    ignoreUnusualBillAmount: false,
    ignoreUnusualBillDate: false,
    invoiceSendingMethod: 'الفوترة الإلكترونية والبريد الإلكتروني',
    electronicInvoiceFormat: 'تنسيق XML',
    peppolId: 'Your endpoint',
    followupStatus: 'لا حاجة لاتخاذ إجراء',
    followupReminderType: 'auto',

    // Notes
    internalNotes: 'مورد رئيسي للمواد الخام والتجهيزات المكتبية.',
  },
  {
    id: 'vend-2',
    type: 'company',
    name: 'مؤسسة التقنية والبرمجيات المتطورة',
    email: 'info@advtech-ye.com',
    phone: '+967 1 987654',
    street: 'شارع حدة',
    street2: 'برج النصر',
    city: 'صنعاء',
    state: 'صنعاء',
    zip: '67890',
    country: 'اليمن',
    taxId: '300987654321',
    website: 'https://advtech-ye.com',
    tags: ['خدمات تقنية', 'برمجيات'],
    avatarColor: '#059669', // Emerald
    billsCount: 1,
    billedAmount: 12500.0,
    purchasesCount: 2,
    contacts: [],

    // Sales & Purchase
    pricelist: 'افتراضي (YER)',
    customerLocation: 'Customers',
    vendorLocation: 'Vendors',
    groupRfq: 'On Order',
    purchasePaymentTerms: 'فوري عند الاستلام',
    purchasePaymentMethod: 'تحويل بنكي',

    // Accounting
    accountReceivable: 'Account Receivable 121000',
    accountPayable: 'Account Payable 211000',
    autoBillPosting: 'السؤال بعد 3 عمليات تصديق دون تعديلات',

    // Notes
    internalNotes: 'تراخيص البرمجيات وخدمات السحابة.',
  },
];
