import { normalizeAttributeValue } from '@/features/ecommerce/domain/types/catalog-attribute';

describe('normalizeAttributeValue', () => {
  it('keeps explicit colorHex and imageUrl', () => {
    expect(
      normalizeAttributeValue(
        {
          id: '1',
          nameAr: 'أحمر',
          colorHex: '#ef4444',
          imageUrl: 'https://example.com/a.png',
        },
        'color',
      ),
    ).toEqual({
      id: '1',
      nameAr: 'أحمر',
      freeText: undefined,
      defaultExtraPrice: undefined,
      colorHex: '#ef4444',
      imageUrl: 'https://example.com/a.png',
    });
  });

  it('maps legacy extra hex to colorHex', () => {
    expect(
      normalizeAttributeValue({ id: '1', nameAr: 'أزرق', extra: '#3b82f6' }, 'color').colorHex,
    ).toBe('#3b82f6');
  });

  it('maps legacy extra url to imageUrl', () => {
    expect(
      normalizeAttributeValue(
        { id: '1', nameAr: 'خشب', extra: 'https://cdn.example/wood.jpg' },
        'image',
      ).imageUrl,
    ).toBe('https://cdn.example/wood.jpg');
  });
});
