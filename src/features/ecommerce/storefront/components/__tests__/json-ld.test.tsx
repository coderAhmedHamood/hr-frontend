jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}));

jest.mock('@/i18n/navigation', () => ({
  getPathname: ({ locale, href }: { locale: string; href: string }) => `/${locale}${href}`,
}));

jest.mock('@/i18n/routing', () => ({
  routing: { locales: ['ar', 'en'] },
}));

import { render } from '@testing-library/react';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd } from '@/features/ecommerce/storefront/lib/seo';

describe('JsonLd', () => {
  it('escapes `</script>` so admin-entered text cannot break out of the script tag', () => {
    const malicious = { name: '</script><script>alert(1)</script>' };
    const { container } = render(<JsonLd data={malicious} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script?.innerHTML).not.toContain('</script><script>');
    expect(script?.innerHTML).not.toContain('</script>');
    expect(script?.innerHTML).toContain('\\u003c/script>');
  });

  it('still produces valid, parseable JSON after escaping', () => {
    const data = { '@type': 'Product', name: '</script>ابغي أكسر الصفحة' };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    const parsed = JSON.parse(script!.innerHTML.replace(/\\u003c/g, '<'));
    expect(parsed.name).toBe(data.name);
  });

  it('renders breadcrumb JSON-LD with locale-aware paths', () => {
    const data = breadcrumbJsonLd(
      [
        { name: 'الرئيسية', path: '/store' },
        { name: 'المنتجات', path: '/store/products' },
      ],
      'ar',
    );
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);

    expect(parsed['@type']).toBe('BreadcrumbList');
    expect(parsed.inLanguage).toBe('ar');
    expect(parsed.itemListElement).toHaveLength(2);
  });
});
