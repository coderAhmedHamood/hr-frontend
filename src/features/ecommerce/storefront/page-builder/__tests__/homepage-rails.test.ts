import { pickRailProducts } from '@/features/ecommerce/storefront/page-builder/lib/homepage-rails';

const ids = (picked: Array<{ id: string }>) => picked.map((item) => item.id);
const row = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => ({ id: `${prefix}${index + 1}` }));

describe('homepage rails repeat a product only when the rail would be short', () => {
  it('skips products already shown when 10 others can fill أسعار الجملة', () => {
    const seen = new Set(['shown-1', 'shown-2']);
    const wholesale = [{ id: 'shown-1' }, { id: 'shown-2' }, ...row(12, 'w')];
    expect(ids(pickRailProducts(wholesale, seen, 10))).toEqual(ids(row(10, 'w')));
  });

  it('keeps products already shown when the alternatives are fewer than 10', () => {
    const seen = new Set(['shown-1', 'shown-2']);
    const wholesale = [{ id: 'shown-1' }, { id: 'shown-2' }, ...row(4, 'w')];
    expect(ids(pickRailProducts(wholesale, seen, 10))).toEqual(['shown-1', 'shown-2', 'w1', 'w2', 'w3', 'w4']);
  });

  it('keeps every product when the whole list is under 10 and was already shown', () => {
    const three = row(3, 'p');
    const seen = new Set(three.map((item) => item.id));
    expect(ids(pickRailProducts(three, seen, 10))).toEqual(['p1', 'p2', 'p3']);
  });
});
