import { apiFormRequest, apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';
import { normalizeAttachmentTags } from '@/features/hr/organization/employees/lib/employee-attachments-utils';

export type EmployeeAttachmentUploadCategory = 'image' | 'pdf' | 'document' | 'spreadsheet' | 'other';

export type EmployeeAttachmentDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string | null;
  name: string;
  originalFileName: string;
  storedFileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadCategory: EmployeeAttachmentUploadCategory;
  documentType: string | null;
  description: string | null;
  tags: string[];
  isArchived: boolean;
  archivedAt: string | null;
  archivedReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateEmployeeAttachmentDto = {
  companyId: string;
  employeeId: string;
  name: string;
  url: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
  documentType?: string | null;
  description?: string | null;
  tags?: string[];
  createdBy?: string | null;
};

export type EmployeeAttachmentUploadInput = {
  file: File;
  companyId: string;
  employeeId: string;
  name: string;
  documentType?: string | null;
  description?: string | null;
  tags?: string[];
  createdBy?: string | null;
};

export type EmployeeAttachmentListParams = {
  page?: number;
  limit?: number;
  archiveScope?: OrganizationArchiveScope;
  companyId?: string;
  employeeId?: string;
  documentType?: string;
  uploadCategory?: string;
  mimeType?: string;
  name?: string;
  originalFileName?: string;
  storedFileName?: string;
  url?: string;
  search?: string;
  tag?: string;
  createdBy?: string;
  updatedBy?: string;
  createdFrom?: string;
  createdTo?: string;
  archivedFrom?: string;
  archivedTo?: string;
  sizeMin?: number;
  sizeMax?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
};

function appendOptionalFormField(formData: FormData, key: string, value: string | null | undefined) {
  if (value != null && value !== '') {
    formData.append(key, value);
  }
}

function tagsToFormValue(tags: string[] | undefined): string | undefined {
  if (!tags?.length) return undefined;
  return tags.join(', ');
}

function normalizeEmployeeAttachment(row: EmployeeAttachmentDto): EmployeeAttachmentDto {
  return {
    ...row,
    tags: normalizeAttachmentTags(row.tags),
    employeeNameAr: row.employeeNameAr ?? null,
    documentType: row.documentType ?? null,
    description: row.description ?? null,
    archivedAt: row.archivedAt ?? null,
    archivedReason: row.archivedReason ?? null,
    createdBy: row.createdBy ?? null,
    updatedBy: row.updatedBy ?? null,
  };
}

export const employeeAttachmentsApi = {
  async upload(input: EmployeeAttachmentUploadInput, signal?: AbortSignal) {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('companyId', input.companyId);
    formData.append('employeeId', input.employeeId);
    formData.append('name', input.name);
    appendOptionalFormField(formData, 'documentType', input.documentType);
    appendOptionalFormField(formData, 'description', input.description);
    appendOptionalFormField(formData, 'tags', tagsToFormValue(input.tags));
    appendOptionalFormField(formData, 'createdBy', input.createdBy);
    const row = await apiFormRequest<EmployeeAttachmentDto>('/hr/employee-attachments/upload', formData, signal);
    return normalizeEmployeeAttachment(row);
  },

  async create(body: CreateEmployeeAttachmentDto) {
    const row = await apiRequest<EmployeeAttachmentDto>('/hr/employee-attachments', { method: 'POST', body });
    return normalizeEmployeeAttachment(row);
  },

  async getAll(params?: EmployeeAttachmentListParams) {
    const res = await apiRequest<PaginatedResult<EmployeeAttachmentDto>>('/hr/employee-attachments', { query: params });
    return {
      ...res,
      items: res.items.map(normalizeEmployeeAttachment),
    };
  },

  async getById(id: string) {
    const row = await apiRequest<EmployeeAttachmentDto>(`/hr/employee-attachments/${id}`);
    return normalizeEmployeeAttachment(row);
  },
};
