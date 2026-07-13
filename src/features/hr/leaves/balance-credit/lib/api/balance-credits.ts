import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  BalanceCreditStatus,
  BalanceCreditRequestResponseDto,
  BulkBalanceCreditRequestResponseDto,
  CreateBalanceCreditRequestDto,
  CreateBulkBalanceCreditRequestDto,
  UpdateBalanceCreditRequestDto,
  BalanceCreditListQuery,
} from '@/features/hr/leaves/types/api/balance-credits';
export type {
  BalanceCreditStatus,
  BalanceCreditRequestResponseDto,
  BulkBalanceCreditRequestResponseDto,
  CreateBalanceCreditRequestDto,
  CreateBulkBalanceCreditRequestDto,
  UpdateBalanceCreditRequestDto,
  BalanceCreditListQuery,
} from '@/features/hr/leaves/types/api/balance-credits';

export const balanceCreditsApi = {
  getAll(query?: BalanceCreditListQuery) {
    return apiRequest<PaginatedResult<BalanceCreditRequestResponseDto>>('/leaves/balance-credits', { query });
  },
  getById(id: string) {
    return apiRequest<BalanceCreditRequestResponseDto>(`/leaves/balance-credits/${id}`);
  },
  create(payload: CreateBalanceCreditRequestDto) {
    return apiRequest<BalanceCreditRequestResponseDto>('/leaves/balance-credits', {
      method: 'POST',
      body: payload,
    });
  },
  bulkCreate(payload: CreateBulkBalanceCreditRequestDto) {
    return apiRequest<BulkBalanceCreditRequestResponseDto>('/leaves/balance-credits/bulk', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateBalanceCreditRequestDto) {
    return apiRequest<BalanceCreditRequestResponseDto>(`/leaves/balance-credits/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/leaves/balance-credits/${id}`, { method: 'DELETE' });
  },
};
