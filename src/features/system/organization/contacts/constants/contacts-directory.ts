export type ExternalPartyKind =
  | 'customer'
  | 'visitor'
  | 'supplier'
  | 'partner'
  | 'sales_lead'
  | 'other';

export const EXTERNAL_PARTY_KIND_LABELS: Record<ExternalPartyKind, string> = {
  customer: 'عميل',
  visitor: 'زائر',
  supplier: 'مورّد',
  partner: 'شريك',
  sales_lead: 'عميل محتمل',
  other: 'أخرى',
};

export type ContactsKindFilter = 'all' | ExternalPartyKind;

export const CONTACT_KIND_FILTER_OPTIONS: { value: ContactsKindFilter; label: string }[] = [
  { value: 'all', label: 'كل الأنواع' },
  ...(Object.entries(EXTERNAL_PARTY_KIND_LABELS) as [ExternalPartyKind, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

export type ContactsDraftForm = {
  kind: ExternalPartyKind;
  nameAr: string;
  phone: string;
  email: string;
  organizationAr: string;
  notes: string;
};

export const CONTACTS_EMPTY_FORM: ContactsDraftForm = {
  kind: 'customer',
  nameAr: '',
  phone: '',
  email: '',
  organizationAr: '',
  notes: '',
};
