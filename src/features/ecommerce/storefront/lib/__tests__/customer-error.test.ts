import { customerErrorText } from '@/features/ecommerce/storefront/lib/customer-error';

const FALLBACK = 'تعذّر إتمام الطلب الآن.';

describe('customerErrorText', () => {
  it('never shows an English message or an id', () => {
    expect(
      customerErrorText(
        new Error('Product #50beab2d-680f-4264-9e67-6f494362046f has variants — variantId is required'),
        FALLBACK,
      ),
    ).toBe(FALLBACK);
    expect(customerErrorText('INVALID_ADDRESS', FALLBACK)).toBe(FALLBACK);
  });

  it('keeps an Arabic message and drops ids from it', () => {
    expect(
      customerErrorText(
        { message: 'المنتج «عباية» #50beab2d-680f-4264-9e67-6f494362046f له خيارات' },
        FALLBACK,
      ),
    ).toBe('المنتج «عباية» له خيارات');
  });

  it('translates the known English ones', () => {
    expect(customerErrorText(new Error('Failed to fetch'), FALLBACK)).toMatch(/الاتصال/);
    expect(customerErrorText(new Error('Account is inactive'), FALLBACK)).toMatch(/غير مفعّل/);
  });
});
