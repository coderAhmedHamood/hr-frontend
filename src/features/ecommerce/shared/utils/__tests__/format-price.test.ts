import { formatPrice } from '../format-price';

describe('formatPrice', () => {
  it('formats a YER amount using the ar-YE locale', () => {
    const result = formatPrice({ amount: 2500, currency: 'YER' });
    expect(result).toMatch(/2.?500/);
    expect(result.toLowerCase()).toMatch(/yer|ر\.?\s?ي|yemen/i);
  });

  it('formats different currencies without throwing', () => {
    const yer = formatPrice({ amount: 100, currency: 'YER' });
    const usd = formatPrice({ amount: 100, currency: 'USD' });
    expect(yer).not.toEqual(usd);
  });

  it('handles zero amounts', () => {
    expect(() => formatPrice({ amount: 0, currency: 'YER' })).not.toThrow();
  });
});
