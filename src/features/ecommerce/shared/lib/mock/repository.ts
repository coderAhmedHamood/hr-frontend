import type { PaginatedResult, PaginationMeta } from '@/features/ecommerce/domain/types/common';

const MOCK_LATENCY_MS = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

type PageQuery = {
  companyId: string;
  page?: number;
  limit?: number;
};

/**
 * In-memory paginated "repository" over a mock JSON fixture, scoped by `companyId`.
 * Mirrors the shape `apiRequest<PaginatedResult<T>>(path, { query })` returns today, so
 * swapping a real backend endpoint in later only touches the `*Api` module, not its callers.
 */
export function createMockRepository<T extends { companyId: string; id: string; slug?: string }>(seed: T[]) {
  const records = [...seed];

  async function list<Q extends PageQuery>(
    query: Q,
    filter?: (item: T, query: Q) => boolean,
    sort?: (a: T, b: T) => number,
  ): Promise<PaginatedResult<T>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const scoped = records.filter((item) => item.companyId === query.companyId);
    const filtered = filter ? scoped.filter((item) => filter(item, query)) : scoped;
    const sorted = sort ? [...filtered].sort(sort) : filtered;

    const total = sorted.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);

    const pagination: PaginationMeta = { page, limit, total, totalPages };
    return delay({ items, pagination });
  }

  async function getById(companyId: string, id: string): Promise<T | null> {
    const found = records.find((item) => item.companyId === companyId && item.id === id) ?? null;
    return delay(found);
  }

  async function getBySlug(companyId: string, slug: string): Promise<T | null> {
    const found = records.find((item) => item.companyId === companyId && item.slug === slug) ?? null;
    return delay(found);
  }

  async function getByIds(companyId: string, ids: string[]): Promise<T[]> {
    const idSet = new Set(ids);
    const found = records.filter((item) => item.companyId === companyId && idSet.has(item.id));
    return delay(found);
  }

  async function create(record: T): Promise<T> {
    records.push(record);
    return delay(record);
  }

  async function update(companyId: string, id: string, patch: Partial<T>): Promise<T | null> {
    const index = records.findIndex((item) => item.companyId === companyId && item.id === id);
    if (index === -1) return delay(null);
    records[index] = { ...records[index], ...patch };
    return delay(records[index]);
  }

  async function remove(companyId: string, id: string): Promise<boolean> {
    const index = records.findIndex((item) => item.companyId === companyId && item.id === id);
    if (index === -1) return delay(false);
    records.splice(index, 1);
    return delay(true);
  }

  /** Applies `patch` to every matching id, scoped by `companyId`. Returns the updated records. */
  async function bulkUpdate(companyId: string, ids: string[], patch: Partial<T>): Promise<T[]> {
    const idSet = new Set(ids);
    const updated: T[] = [];
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      if (record.companyId === companyId && idSet.has(record.id)) {
        records[index] = { ...record, ...patch };
        updated.push(records[index]);
      }
    }
    return delay(updated);
  }

  /** Removes every matching id, scoped by `companyId`. Returns the count actually removed. */
  async function bulkRemove(companyId: string, ids: string[]): Promise<number> {
    const idSet = new Set(ids);
    const before = records.length;
    for (let index = records.length - 1; index >= 0; index -= 1) {
      const record = records[index];
      if (record.companyId === companyId && idSet.has(record.id)) {
        records.splice(index, 1);
      }
    }
    return delay(before - records.length);
  }

  /**
   * Clones a record, applying `buildOverrides(source)` on top (new id/slug/etc. — entity-specific,
   * so it's the caller's job, not the repository's). Not a generic "clone with random suffix"
   * helper — the `*Api` layer decides what "duplicate" means for its entity.
   */
  async function duplicate(companyId: string, id: string, buildOverrides: (source: T) => Partial<T>): Promise<T | null> {
    const source = records.find((item) => item.companyId === companyId && item.id === id);
    if (!source) return delay(null);
    const clone = { ...source, ...buildOverrides(source) };
    records.push(clone);
    return delay(clone);
  }

  return { list, getById, getByIds, getBySlug, create, update, remove, bulkUpdate, bulkRemove, duplicate };
}
