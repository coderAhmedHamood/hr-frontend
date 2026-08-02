import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';

describe('formatPrice', () => {
  it('formats a SAR amount using the ar-SA locale', () => {
    const result = formatPrice({ amount: 2500, currency: 'SAR' });
    expect(result).toContain('٢٬٥٠٠');
    expect(result).toContain('ر.س');
  });

  it('reads currency from the Money value rather than assuming a fixed currency', () => {
    const sar = formatPrice({ amount: 100, currency: 'SAR' });
    const usd = formatPrice({ amount: 100, currency: 'USD' });
    expect(sar).not.toBe(usd);
  });

  it('formats zero without throwing', () => {
    expect(() => formatPrice({ amount: 0, currency: 'SAR' })).not.toThrow();
  });
});
