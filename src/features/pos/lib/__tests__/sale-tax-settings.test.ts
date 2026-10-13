import type { PosSaleLine } from '@/features/pos/domain/types';
import { priceLines, saleTaxSettings } from '@/features/pos/lib/calc';

/** A sale revised later keeps the tax it was priced with. */
const line = (over: Partial<PosSaleLine> = {}): PosSaleLine => ({
  id: 'l',
  productId: 'p',
  variantId: null,
  name: 'x',
  variantName: null,
  sku: 's',
  quantity: 2,
  sourcePrice: 100,
  unitPrice: 100,
  discount: null,
  discountAmount: 0,
  taxRate: 0,
  taxAmount: 0,
  total: 200,
  returnedQuantity: 0,
  ...over,
});

const today = { enabled: true, rate: 5, pricesIncludeTax: false };

describe('saleTaxSettings', () => {
  it('reads an inclusive 15% back from the lines', () => {
    const sold = priceLines([line()], null, { enabled: true, rate: 15, pricesIncludeTax: true }).lines;
    expect(saleTaxSettings(sold, today)).toEqual({ enabled: true, rate: 15, pricesIncludeTax: true });
  });

  it('reads an exclusive 15% back from the lines', () => {
    const sold = priceLines([line()], null, { enabled: true, rate: 15, pricesIncludeTax: false }).lines;
    expect(saleTaxSettings(sold, today)).toEqual({ enabled: true, rate: 15, pricesIncludeTax: false });
  });

  it('a sale made without tax stays without tax', () => {
    expect(saleTaxSettings([line()], today)).toMatchObject({ enabled: false, rate: 0 });
  });

  it('repricing with it gives the same totals as the sale', () => {
    const tax = { enabled: true, rate: 15, pricesIncludeTax: false };
    const sold = priceLines([line()], null, tax);
    const again = priceLines(sold.lines, null, saleTaxSettings(sold.lines, today));
    expect(again.totals).toEqual(sold.totals);
  });
});
