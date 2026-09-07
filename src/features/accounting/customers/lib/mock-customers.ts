import type { Customer } from '@/features/accounting/domain/types/customer';

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    type: 'person',
    name: 'علي بن علي',
    email: '',
    phone: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    taxId: 'غير منطبق',
    website: '',
    tags: [],
    avatarColor: '#9333ea', // Purple / Magenta as in screenshot
    salesCount: 0,
    invoicedAmount: 0.0,
    purchasesCount: 0,
    contacts: [],

    // Sales & Purchase
    pricelist: 'افتراضي (YER)',
    customerLocation: 'Customers',
    vendorLocation: 'Vendors',
    groupRfq: 'On Order',

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
    responsibleUser: '',

    // Notes
    internalNotes: '',
  },
];
