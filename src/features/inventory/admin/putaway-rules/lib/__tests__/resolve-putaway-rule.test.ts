import {
  resolvePutawayDestination,
  resolvePutawayRule,
} from '@/features/inventory/admin/putaway-rules/lib/resolve-putaway-rule';
import type { PutawayRule } from '@/features/inventory/domain/types/putaway-rule';

const base = {
  companyId: 'demo-company',
  warehouseId: 'wh-main',
  arriveLocationId: 'loc-vendors',
  storeLocationId: 'loc-stock',
  subLocationId: null as string | null,
  packagingType: null as PutawayRule['packagingType'],
  sequence: 10,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const rules: PutawayRule[] = [
  {
    ...base,
    id: 'r-all',
    appliesTo: 'all',
    productId: null,
    categoryId: null,
    sequence: 100,
  },
  {
    ...base,
    id: 'r-cat',
    appliesTo: 'category',
    productId: null,
    categoryId: 'cat-1',
    sequence: 10,
  },
  {
    ...base,
    id: 'r-prod',
    appliesTo: 'product',
    productId: 'prod-1',
    categoryId: null,
    sequence: 5,
    subLocationId: 'loc-shelf',
  },
];

describe('resolvePutawayRule', () => {
  it('prefers product over category over all', () => {
    const matched = resolvePutawayRule(rules, {
      warehouseId: 'wh-main',
      arriveLocationId: 'loc-vendors',
      productId: 'prod-1',
      categoryId: 'cat-1',
    });
    expect(matched?.id).toBe('r-prod');
    expect(resolvePutawayDestination(matched!)).toBe('loc-shelf');
  });

  it('falls back to category then all', () => {
    expect(
      resolvePutawayRule(rules, {
        warehouseId: 'wh-main',
        arriveLocationId: 'loc-vendors',
        productId: 'prod-other',
        categoryId: 'cat-1',
      })?.id,
    ).toBe('r-cat');

    expect(
      resolvePutawayRule(rules, {
        warehouseId: 'wh-main',
        arriveLocationId: 'loc-vendors',
        productId: 'prod-other',
        categoryId: 'cat-other',
      })?.id,
    ).toBe('r-all');
  });
});
