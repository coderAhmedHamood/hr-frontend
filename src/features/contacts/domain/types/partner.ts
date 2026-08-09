export type PartnerStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type PartnerAddressType =
  | 'main'
  | 'billing'
  | 'shipping'
  | 'warehouse'
  | 'branch'
  | 'other';

export type PartnerChannelType =
  | 'mobile'
  | 'phone'
  | 'email'
  | 'website'
  | 'whatsapp'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'other';

export type PartnerRelationType =
  | 'parent_company'
  | 'child_contact'
  | 'billing_contact'
  | 'shipping_contact'
  | 'emergency_contact'
  | 'guardian'
  | 'owner'
  | 'other';

export type PartnerActivityType = 'note' | 'call' | 'meeting' | 'email' | 'task' | 'message';

export type PartnerActivityStatus = 'planned' | 'done' | 'cancelled';

export type ArchiveScope = 'active' | 'archived' | 'all';

export type Partner = {
  id: string;
  companyId: string;
  branchId?: string | null;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  displayName: string;
  isCompany: boolean;
  status: PartnerStatus;
  imageUrl?: string | null;
  isCustomer: boolean;
  isVendor: boolean;
  isEmployee: boolean;
  isInternal: boolean;
  parentId?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  commercialRegistration?: string | null;
  industry?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  languageCode?: string | null;
  currencyCode?: string | null;
  timezone?: string | null;
  paymentTerms?: string | null;
  creditLimitAmount?: string | null;
  creditLimitCurrency?: string | null;
  preferredPaymentMethod?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  refCode?: string | null;
  userId?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type PartnerCategory = {
  id: string;
  companyId: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  color?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerAddress = {
  id: string;
  companyId: string;
  partnerId: string;
  addressType: PartnerAddressType;
  label?: string | null;
  isDefault: boolean;
  countryId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  countryCode?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  building?: string | null;
  postalCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerChannel = {
  id: string;
  companyId: string;
  partnerId: string;
  channelType: PartnerChannelType;
  value: string;
  label?: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PartnerRelation = {
  id: string;
  companyId: string;
  fromPartnerId: string;
  toPartnerId: string;
  relationType: PartnerRelationType;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerNote = {
  id: string;
  companyId: string;
  partnerId: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
};

export type PartnerAttachment = {
  id: string;
  companyId: string;
  partnerId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: string | number | null;
  label?: string | null;
  createdAt: string;
  createdBy?: string | null;
};

export type PartnerActivity = {
  id: string;
  companyId: string;
  branchId?: string | null;
  partnerId: string;
  activityType: PartnerActivityType;
  status: PartnerActivityStatus;
  subject: string;
  body?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerFull = Partner & {
  addresses: PartnerAddress[];
  channels: PartnerChannel[];
  relations: PartnerRelation[];
  categories: PartnerCategory[];
  childrenCount: number;
};

export type PartnerListQuery = {
  companyId: string;
  branchId?: string;
  search?: string;
  status?: PartnerStatus;
  isCompany?: boolean;
  isCustomer?: boolean;
  isVendor?: boolean;
  isEmployee?: boolean;
  isInternal?: boolean;
  parentId?: string;
  rootOnly?: boolean;
  categoryId?: string;
  page?: number;
  limit?: number;
  archiveScope?: ArchiveScope;
};

export type CreatePartnerInput = {
  companyId: string;
  branchId?: string | null;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  displayName?: string | null;
  isCompany?: boolean;
  status?: PartnerStatus;
  imageUrl?: string | null;
  isCustomer?: boolean;
  isVendor?: boolean;
  isEmployee?: boolean;
  isInternal?: boolean;
  parentId?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  commercialRegistration?: string | null;
  industry?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  languageCode?: string | null;
  currencyCode?: string | null;
  timezone?: string | null;
  paymentTerms?: string | null;
  creditLimitAmount?: number | null;
  creditLimitCurrency?: string | null;
  preferredPaymentMethod?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  refCode?: string | null;
};

export type UpdatePartnerInput = Omit<Partial<CreatePartnerInput>, 'companyId'>;

export type PartnerCategoryListQuery = {
  companyId: string;
  search?: string;
  page?: number;
  limit?: number;
  archiveScope?: ArchiveScope;
};

export type CreatePartnerCategoryInput = {
  companyId: string;
  slug?: string | null;
  nameAr: string;
  nameEn?: string | null;
  color?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export type UpdatePartnerCategoryInput = Partial<Omit<CreatePartnerCategoryInput, 'companyId'>>;
