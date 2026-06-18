import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  ContractTemplateDto,
  CreateContractTemplateDto,
  UpdateContractTemplateDto,
} from '@/features/hr/contracts/contract-templates/types/contract-template';

export const contractTemplatesApi = {
  list: (params?: {
    companyId?: string;
    isActive?: boolean;
    defaultContractNature?: string;
    defaultWorkArrangement?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<ContractTemplateDto>>('/payroll/contract-templates', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<ContractTemplateDto>(`/payroll/contract-templates/${id}`),

  create: (body: CreateContractTemplateDto) =>
    apiRequest<ContractTemplateDto>('/payroll/contract-templates', { method: 'POST', body }),

  update: (id: string, body: UpdateContractTemplateDto) =>
    apiRequest<ContractTemplateDto>(`/payroll/contract-templates/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/payroll/contract-templates/${id}`, { method: 'DELETE' }),
};
