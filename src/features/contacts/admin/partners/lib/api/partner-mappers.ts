import type {
  CreatePartnerInput,
  Partner,
  PartnerAddress,
  PartnerCategory,
  PartnerChannel,
  PartnerFull,
  PartnerListQuery,
  PartnerNote,
  PartnerActivity,
  PartnerRelation,
  UpdatePartnerInput,
} from '@/features/contacts/domain/types/partner';

export function mapPartner(dto: Partner): Partner {
  return {
    id: dto.id,
    companyId: dto.companyId,
    branchId: dto.branchId ?? null,
    name: dto.name,
    nameAr: dto.nameAr ?? null,
    nameEn: dto.nameEn ?? null,
    displayName: dto.displayName || dto.name,
    isCompany: Boolean(dto.isCompany),
    status: dto.status ?? 'active',
    imageUrl: dto.imageUrl ?? null,
    isCustomer: Boolean(dto.isCustomer),
    isVendor: Boolean(dto.isVendor),
    isEmployee: Boolean(dto.isEmployee),
    isInternal: Boolean(dto.isInternal),
    parentId: dto.parentId ?? null,
    email: dto.email ?? null,
    mobile: dto.mobile ?? null,
    phone: dto.phone ?? null,
    website: dto.website ?? null,
    taxNumber: dto.taxNumber ?? null,
    commercialRegistration: dto.commercialRegistration ?? null,
    industry: dto.industry ?? null,
    jobTitle: dto.jobTitle ?? null,
    department: dto.department ?? null,
    languageCode: dto.languageCode ?? null,
    currencyCode: dto.currencyCode ?? null,
    timezone: dto.timezone ?? null,
    paymentTerms: dto.paymentTerms ?? null,
    creditLimitAmount: dto.creditLimitAmount ?? null,
    creditLimitCurrency: dto.creditLimitCurrency ?? null,
    preferredPaymentMethod: dto.preferredPaymentMethod ?? null,
    notes: dto.notes ?? null,
    tags: dto.tags ?? null,
    refCode: dto.refCode ?? null,
    userId: dto.userId ?? null,
    isArchived: dto.isArchived,
    archivedAt: dto.archivedAt ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    createdBy: dto.createdBy ?? null,
    updatedBy: dto.updatedBy ?? null,
  };
}

export function mapPartnerFull(dto: PartnerFull): PartnerFull {
  const partner = mapPartner(dto);
  return {
    ...partner,
    addresses: (dto.addresses ?? []) as PartnerAddress[],
    channels: (dto.channels ?? []) as PartnerChannel[],
    relations: (dto.relations ?? []) as PartnerRelation[],
    categories: (dto.categories ?? []) as PartnerCategory[],
    childrenCount: dto.childrenCount ?? 0,
  };
}

export function toPartnerCreateBody(input: CreatePartnerInput) {
  return {
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    name: input.name.trim(),
    nameAr: input.nameAr?.trim() || null,
    nameEn: input.nameEn?.trim() || null,
    displayName: input.displayName?.trim() || input.name.trim(),
    isCompany: input.isCompany ?? false,
    status: input.status ?? 'active',
    imageUrl: input.imageUrl ?? null,
    isCustomer: input.isCustomer ?? false,
    isVendor: input.isVendor ?? false,
    isEmployee: input.isEmployee ?? false,
    isInternal: input.isInternal ?? false,
    parentId: input.parentId || null,
    email: input.email?.trim() || null,
    mobile: input.mobile?.trim() || null,
    phone: input.phone?.trim() || null,
    website: input.website?.trim() || null,
    taxNumber: input.taxNumber?.trim() || null,
    commercialRegistration: input.commercialRegistration?.trim() || null,
    industry: input.industry?.trim() || null,
    jobTitle: input.jobTitle?.trim() || null,
    department: input.department?.trim() || null,
    languageCode: input.languageCode || 'ar',
    currencyCode: input.currencyCode || 'SAR',
    timezone: input.timezone || null,
    paymentTerms: input.paymentTerms?.trim() || null,
    creditLimitAmount: input.creditLimitAmount ?? null,
    creditLimitCurrency: input.creditLimitCurrency || null,
    preferredPaymentMethod: input.preferredPaymentMethod?.trim() || null,
    notes: input.notes?.trim() || null,
    tags: input.tags?.length ? input.tags : null,
    refCode: input.refCode?.trim() || null,
  };
}

export function toPartnerUpdateBody(patch: UpdatePartnerInput) {
  const body: Record<string, unknown> = {};
  const set = <K extends keyof UpdatePartnerInput>(key: K, value: UpdatePartnerInput[K]) => {
    if (value !== undefined) body[key as string] = value;
  };

  if (patch.name !== undefined) body.name = patch.name.trim();
  if (patch.displayName !== undefined) body.displayName = patch.displayName?.trim() || null;
  if (patch.nameAr !== undefined) body.nameAr = patch.nameAr?.trim() || null;
  if (patch.nameEn !== undefined) body.nameEn = patch.nameEn?.trim() || null;
  set('isCompany', patch.isCompany);
  set('status', patch.status);
  set('imageUrl', patch.imageUrl ?? null);
  set('isCustomer', patch.isCustomer);
  set('isVendor', patch.isVendor);
  set('isEmployee', patch.isEmployee);
  set('isInternal', patch.isInternal);
  if (patch.parentId !== undefined) body.parentId = patch.parentId || null;
  if (patch.branchId !== undefined) body.branchId = patch.branchId || null;
  if (patch.email !== undefined) body.email = patch.email?.trim() || null;
  if (patch.mobile !== undefined) body.mobile = patch.mobile?.trim() || null;
  if (patch.phone !== undefined) body.phone = patch.phone?.trim() || null;
  if (patch.website !== undefined) body.website = patch.website?.trim() || null;
  if (patch.taxNumber !== undefined) body.taxNumber = patch.taxNumber?.trim() || null;
  if (patch.commercialRegistration !== undefined) {
    body.commercialRegistration = patch.commercialRegistration?.trim() || null;
  }
  if (patch.industry !== undefined) body.industry = patch.industry?.trim() || null;
  if (patch.jobTitle !== undefined) body.jobTitle = patch.jobTitle?.trim() || null;
  if (patch.department !== undefined) body.department = patch.department?.trim() || null;
  set('languageCode', patch.languageCode);
  set('currencyCode', patch.currencyCode);
  set('timezone', patch.timezone ?? null);
  if (patch.paymentTerms !== undefined) body.paymentTerms = patch.paymentTerms?.trim() || null;
  set('creditLimitAmount', patch.creditLimitAmount ?? null);
  set('creditLimitCurrency', patch.creditLimitCurrency ?? null);
  if (patch.preferredPaymentMethod !== undefined) {
    body.preferredPaymentMethod = patch.preferredPaymentMethod?.trim() || null;
  }
  if (patch.notes !== undefined) body.notes = patch.notes?.trim() || null;
  set('tags', patch.tags ?? null);
  if (patch.refCode !== undefined) body.refCode = patch.refCode?.trim() || null;

  return body;
}

export function partnerListQueryParams(query: PartnerListQuery) {
  return {
    companyId: query.companyId,
    branchId: query.branchId,
    search: query.search,
    status: query.status,
    isCompany: query.isCompany,
    isCustomer: query.isCustomer,
    isVendor: query.isVendor,
    isEmployee: query.isEmployee,
    isInternal: query.isInternal,
    parentId: query.parentId,
    rootOnly: query.rootOnly,
    categoryId: query.categoryId,
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    archiveScope: query.archiveScope ?? 'active',
  };
}

export function mapPartnerNote(dto: PartnerNote): PartnerNote {
  return dto;
}

export function mapPartnerActivity(dto: PartnerActivity): PartnerActivity {
  return dto;
}
