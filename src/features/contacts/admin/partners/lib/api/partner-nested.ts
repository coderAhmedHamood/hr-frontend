import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  PartnerActivity,
  PartnerActivityStatus,
  PartnerActivityType,
  PartnerAddress,
  PartnerAddressType,
  PartnerAttachment,
  PartnerChannel,
  PartnerChannelType,
  PartnerNote,
  PartnerRelation,
  PartnerRelationType,
} from '@/features/contacts/domain/types/partner';

export type PartnerCategoryMember = {
  partnerId: string;
  categoryId: string;
  companyId: string;
  createdAt?: string;
  createdBy?: string | null;
};

export const partnerAddressesApi = {
  async getAll(partnerId: string) {
    const result = await apiRequest<PaginatedResult<PartnerAddress>>('/contacts/partner-addresses', {
      query: { partnerId, page: 1, limit: 100, archiveScope: 'active' },
    });
    return result.items ?? [];
  },

  async create(input: {
    partnerId: string;
    addressType?: PartnerAddressType;
    label?: string | null;
    isDefault?: boolean;
    countryCode?: string | null;
    state?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
    building?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
  }) {
    return apiRequest<PartnerAddress>('/contacts/partner-addresses', {
      method: 'POST',
      body: input,
    });
  },

  async update(id: string, patch: Record<string, unknown>) {
    return apiRequest<PartnerAddress>(`/contacts/partner-addresses/${id}`, {
      method: 'PATCH',
      body: patch,
    });
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partner-addresses/${id}`, { method: 'DELETE' });
    return true;
  },
};

export const partnerChannelsApi = {
  async getAll(partnerId: string) {
    const result = await apiRequest<PaginatedResult<PartnerChannel>>('/contacts/partner-channels', {
      query: { partnerId, page: 1, limit: 100, archiveScope: 'active' },
    });
    return result.items ?? [];
  },

  async create(input: {
    partnerId: string;
    channelType: PartnerChannelType;
    value: string;
    label?: string | null;
    isPrimary?: boolean;
    isVerified?: boolean;
    sortOrder?: number;
  }) {
    return apiRequest<PartnerChannel>('/contacts/partner-channels', {
      method: 'POST',
      body: input,
    });
  },

  async update(id: string, patch: Record<string, unknown>) {
    return apiRequest<PartnerChannel>(`/contacts/partner-channels/${id}`, {
      method: 'PATCH',
      body: patch,
    });
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partner-channels/${id}`, { method: 'DELETE' });
    return true;
  },
};

export const partnerRelationsApi = {
  async getAll(partnerId: string) {
    const result = await apiRequest<PaginatedResult<PartnerRelation>>('/contacts/partner-relations', {
      query: { partnerId, page: 1, limit: 100, archiveScope: 'active' },
    });
    return result.items ?? [];
  },

  async create(input: {
    fromPartnerId: string;
    toPartnerId: string;
    relationType: PartnerRelationType;
    notes?: string | null;
  }) {
    return apiRequest<PartnerRelation>('/contacts/partner-relations', {
      method: 'POST',
      body: input,
    });
  },

  async update(id: string, patch: { toPartnerId?: string; relationType?: PartnerRelationType; notes?: string | null }) {
    return apiRequest<PartnerRelation>(`/contacts/partner-relations/${id}`, {
      method: 'PATCH',
      body: patch,
    });
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partner-relations/${id}`, { method: 'DELETE' });
    return true;
  },
};

export const partnerCategoryMembersApi = {
  async getAll(partnerId: string) {
    const result = await apiRequest<PaginatedResult<PartnerCategoryMember>>(
      '/contacts/partner-category-members',
      {
        query: { partnerId, page: 1, limit: 200 },
      },
    );
    return result.items ?? [];
  },

  async create(input: { partnerId: string; categoryId: string }) {
    return apiRequest<PartnerCategoryMember>('/contacts/partner-category-members', {
      method: 'POST',
      body: input,
    });
  },

  async remove(partnerId: string, categoryId: string) {
    await apiRequest<void>(`/contacts/partner-category-members/${partnerId}/${categoryId}`, {
      method: 'DELETE',
    });
    return true;
  },
};

export const partnerNotesApi = {
  async getAll(partnerId: string) {
    const result = await apiRequest<PaginatedResult<PartnerNote>>('/contacts/partner-notes', {
      query: { partnerId, page: 1, limit: 100, archiveScope: 'active' },
    });
    return result.items ?? [];
  },

  async create(input: { partnerId: string; body: string; isPinned?: boolean }) {
    return apiRequest<PartnerNote>('/contacts/partner-notes', {
      method: 'POST',
      body: input,
    });
  },

  async update(id: string, patch: { body?: string; isPinned?: boolean }) {
    return apiRequest<PartnerNote>(`/contacts/partner-notes/${id}`, {
      method: 'PATCH',
      body: patch,
    });
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partner-notes/${id}`, { method: 'DELETE' });
    return true;
  },
};

export const partnerAttachmentsApi = {
  async getAll(partnerId: string) {
    const result = await apiRequest<PaginatedResult<PartnerAttachment>>(
      '/contacts/partner-attachments',
      {
        query: { partnerId, page: 1, limit: 100, archiveScope: 'active' },
      },
    );
    return result.items ?? [];
  },

  async create(input: {
    partnerId: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    label?: string | null;
  }) {
    return apiRequest<PartnerAttachment>('/contacts/partner-attachments', {
      method: 'POST',
      body: input,
    });
  },

  async update(id: string, patch: { fileName?: string; fileUrl?: string; mimeType?: string | null; label?: string | null }) {
    return apiRequest<PartnerAttachment>(`/contacts/partner-attachments/${id}`, {
      method: 'PATCH',
      body: patch,
    });
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partner-attachments/${id}`, { method: 'DELETE' });
    return true;
  },
};

export const partnerActivitiesApi = {
  async getAll(partnerId: string) {
    const result = await apiRequest<PaginatedResult<PartnerActivity>>('/contacts/partner-activities', {
      query: { partnerId, page: 1, limit: 100, archiveScope: 'active' },
    });
    return result.items ?? [];
  },

  async create(input: {
    partnerId: string;
    activityType: PartnerActivityType;
    subject: string;
    status?: PartnerActivityStatus;
    body?: string | null;
    dueAt?: string | null;
    branchId?: string | null;
    assignedTo?: string | null;
  }) {
    return apiRequest<PartnerActivity>('/contacts/partner-activities', {
      method: 'POST',
      body: input,
    });
  },

  async update(id: string, patch: Partial<PartnerActivity>) {
    return apiRequest<PartnerActivity>(`/contacts/partner-activities/${id}`, {
      method: 'PATCH',
      body: patch,
    });
  },

  async remove(id: string) {
    await apiRequest<void>(`/contacts/partner-activities/${id}`, { method: 'DELETE' });
    return true;
  },
};
