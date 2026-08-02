jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}));

jest.mock('@/i18n/navigation', () => ({
  getPathname: ({ locale, href }: { locale: string; href: string }) => `/${locale}${href}`,
}));

jest.mock('@/i18n/routing', () => ({
  routing: { locales: ['ar', 'en'] },
}));

import { breadcrumbJsonLd, faqJsonLd } from '@/features/ecommerce/storefront/lib/seo';

describe('faqJsonLd', () => {
  it('maps FAQ items to FAQPage schema', () => {
    const data = faqJsonLd([{ id: '1', question: 'سؤال؟', answer: 'جواب.' }], 'ar');
    expect(data['@type']).toBe('FAQPage');
    expect(data.inLanguage).toBe('ar');
    expect(data.mainEntity).toHaveLength(1);
    expect(data.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'سؤال؟',
      acceptedAnswer: { '@type': 'Answer', text: 'جواب.' },
    });
  });
});

describe('breadcrumbJsonLd', () => {
  it('uses typed /store paths and locale', () => {
    const data = breadcrumbJsonLd(
      [
        { name: 'Home', path: '/store' },
        { name: 'Products', path: '/store/products' },
      ],
      'en',
    );
    expect(data['@type']).toBe('BreadcrumbList');
    expect(data.inLanguage).toBe('en');
    expect(data.itemListElement).toHaveLength(2);
    expect(data.itemListElement[0].position).toBe(1);
    expect(data.itemListElement[1].position).toBe(2);
  });
});
