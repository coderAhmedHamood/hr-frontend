import {
  productAppSectionsFor,
  visibleProductTabs,
  visibleRelatedDocs,
} from '@/features/catalog/products/hooks/use-product-app-sections';
import { isModuleEnabledFor } from '@/shared/modules/registry';

const TABS = [
  { value: 'general' },
  { value: 'attributes' },
  { value: 'availability' },
  { value: 'batches' },
  { value: 'units' },
  { value: 'reviews' },
  { value: 'settings' },
] as const;
const DOCS = ['variants', 'replenish', 'receipts', 'issues', 'internals', 'moves', 'putaway'].map(
  (key) => ({ key }),
);
const tabs = (inventory: boolean, store: boolean) =>
  visibleProductTabs(TABS, { inventory, store }).map((t) => t.value);

describe('product app sections (phase 2.5)', () => {
  it('follows the apps enabled for the company', () => {
    expect(productAppSectionsFor('c1', { enabledApplicationCodes: ['catalog', 'inventory'] })).toEqual({
      inventory: true,
      store: false,
    });
    expect(productAppSectionsFor('c1', { enabledApplicationCodes: ['catalog', 'store-admin'] })).toEqual({
      inventory: false,
      store: true,
    });
    expect(productAppSectionsFor('c1', { enabledApplicationCodes: ['catalog'] })).toEqual({
      inventory: false,
      store: false,
    });
  });

  it('keeps every section for pre-migration sessions and the system owner', () => {
    expect(productAppSectionsFor('c1', { enabledApplicationCodes: null })).toEqual({
      inventory: true,
      store: true,
    });
    expect(
      productAppSectionsFor('c1', { isSystemOwner: true, enabledApplicationCodes: ['catalog'] }),
    ).toEqual({ inventory: true, store: true });
  });

  it('shows inventory and store tabs only with their app', () => {
    expect(tabs(true, true)).toEqual(TABS.map((t) => t.value));
    expect(tabs(true, false)).toEqual(['general', 'attributes', 'availability', 'batches', 'units', 'settings']);
    expect(tabs(false, true)).toEqual(['general', 'attributes', 'availability', 'units', 'reviews', 'settings']);
    expect(tabs(false, false)).toEqual(['general', 'attributes', 'units', 'settings']);
  });

  it('hides stock shortcuts without inventory', () => {
    expect(visibleRelatedDocs(DOCS, { inventory: true, store: false })).toHaveLength(DOCS.length);
    expect(visibleRelatedDocs(DOCS, { inventory: false, store: true }).map((d) => d.key)).toEqual([
      'variants',
    ]);
  });

  it('registers the catalog app', () => {
    expect(isModuleEnabledFor('catalog', 'c1', { enabledApplicationCodes: ['catalog'] })).toBe(true);
    expect(isModuleEnabledFor('catalog', 'c1', { enabledApplicationCodes: ['hr'] })).toBe(false);
  });
});
