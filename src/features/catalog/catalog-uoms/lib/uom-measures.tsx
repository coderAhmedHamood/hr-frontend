import * as React from 'react';
import type { CatalogUom, CatalogUomMeasure } from '@/features/catalog/catalog-uoms/lib/api/catalog-uoms';
import { SelectGroup, SelectItem } from '@/components/ui/select';

/**
 * What a unit measures, in the order the pickers show them (2026-10-26):
 * a litre is found among the liquids, a carton among the packagings.
 */
export const UOM_MEASURES: ReadonlyArray<{
  value: CatalogUomMeasure;
  labelAr: string;
  hintAr: string;
}> = [
  { value: 'count', labelAr: 'العدد', hintAr: 'حبة، زوج، درزن، طقم' },
  { value: 'packaging', labelAr: 'التغليف', hintAr: 'علبة، عبوة، كيس، كرتون، باليت' },
  { value: 'weight', labelAr: 'الوزن', hintAr: 'جرام، كيلوجرام، طن' },
  { value: 'volume', labelAr: 'الحجم والسوائل', hintAr: 'مليلتر، لتر، جالون' },
  { value: 'length', labelAr: 'الطول', hintAr: 'سنتيمتر، متر' },
];

export const UOM_MEASURE_LABELS_AR: Record<CatalogUomMeasure, string> = Object.fromEntries(
  UOM_MEASURES.map((m) => [m.value, m.labelAr]),
) as Record<CatalogUomMeasure, string>;

/** Counted and packed units are countable; the others are measured. */
export function categoryForMeasure(measure: CatalogUomMeasure): CatalogUom['category'] {
  return measure === 'count' || measure === 'packaging' ? 'countable' : 'bulk';
}

/** The units of each measure (empty measures left out), in display order. */
export function groupUomsByMeasure<T extends Pick<CatalogUom, 'measure' | 'displayOrder'>>(
  items: readonly T[],
): Array<{ value: CatalogUomMeasure; labelAr: string; items: T[] }> {
  return UOM_MEASURES.map((m) => ({
    value: m.value,
    labelAr: m.labelAr,
    items: items
      .filter((item) => (item.measure ?? 'count') === m.value)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  })).filter((group) => group.items.length > 0);
}

/** Select items of units, under a heading per measure. */
export function UomSelectItems({ items }: { items: readonly CatalogUom[] }) {
  return (
    <>
      {groupUomsByMeasure(items).map((group) => (
        <SelectGroup key={group.value}>
          <div className="px-2 pb-1 pt-2 text-[11px] font-semibold text-muted-foreground">
            {group.labelAr}
          </div>
          {group.items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.nameAr}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}
