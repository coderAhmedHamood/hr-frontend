import { categoryForMeasure, groupUomsByMeasure } from '@/features/catalog/catalog-uoms/lib/uom-measures';

const unit = (id: string, measure: string, displayOrder: number) => ({
  id,
  measure: measure as never,
  displayOrder,
});

describe('unit measures', () => {
  it('groups units by measure in picker order, each sorted, empty groups left out', () => {
    const groups = groupUomsByMeasure([
      unit('l', 'volume', 420),
      unit('carton', 'packaging', 250),
      unit('ml', 'volume', 410),
      unit('piece', 'count', 110),
    ]);
    expect(groups.map((g) => [g.labelAr, g.items.map((i) => i.id)])).toEqual([
      ['العدد', ['piece']],
      ['التغليف', ['carton']],
      ['الحجم والسوائل', ['ml', 'l']],
    ]);
  });

  it('a unit without a measure (older server) counts as العدد', () => {
    const groups = groupUomsByMeasure([{ id: 'x', measure: undefined as never, displayOrder: 1 }]);
    expect(groups[0]?.labelAr).toBe('العدد');
  });

  it('counted and packed are countable; weight, volume and length are measured', () => {
    expect(categoryForMeasure('count')).toBe('countable');
    expect(categoryForMeasure('packaging')).toBe('countable');
    expect(categoryForMeasure('weight')).toBe('bulk');
    expect(categoryForMeasure('volume')).toBe('bulk');
    expect(categoryForMeasure('length')).toBe('bulk');
  });
});
