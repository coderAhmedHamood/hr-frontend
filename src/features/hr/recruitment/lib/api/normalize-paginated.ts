import type { PaginatedResult, PaginationMeta } from '@/features/hr/lib/api/client';

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 200,
  total: 0,
  totalPages: 0,
};

/** Normalizes backend paginated payloads (`items` + `pagination` or flat meta fields). */
export function normalizeRecruitmentPaginated<T>(value: unknown): PaginatedResult<T> {
  if (!value) {
    return { items: [], pagination: EMPTY_PAGINATION };
  }

  if (Array.isArray(value)) {
    const total = value.length;
    return {
      items: value as T[],
      pagination: { page: 1, limit: total, total, totalPages: 1 },
    };
  }

  if (typeof value !== 'object') {
    return { items: [], pagination: EMPTY_PAGINATION };
  }

  const record = value as Record<string, unknown>;
  const items = record.items;

  if (!Array.isArray(items)) {
    return { items: [], pagination: EMPTY_PAGINATION };
  }

  const pagination = record.pagination;
  if (pagination && typeof pagination === 'object') {
    return { items: items as T[], pagination: pagination as PaginationMeta };
  }

  return {
    items: items as T[],
    pagination: {
      page: Number(record.page ?? 1),
      limit: Number(record.limit ?? items.length),
      total: Number(record.total ?? items.length),
      totalPages: Number(record.totalPages ?? 1),
    },
  };
}
