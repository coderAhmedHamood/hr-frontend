import { normalizeCmsSectionDto } from '@/features/ecommerce/storefront/page-builder/lib/normalize-cms-section-dto';
import { mapStorefrontPage } from '@/features/ecommerce/storefront/page-builder/lib/mappers/page-mapper';

describe('normalizeCmsSectionDto', () => {
  it('maps backend seed titleAr/titleEn into nested title', () => {
    const section = normalizeCmsSectionDto({
      id: 'a5d95204-d0a4-48a5-8a0e-1ed61853dfe3',
      sectionType: 'product-carousel',
      status: 'published',
      enabled: true,
      sortOrder: 2,
      revision: 2,
      content: { titleAr: 'منتجات جديدة', titleEn: 'New arrivals' },
      settings: { limit: 12 },
      style: {},
      dataSourceKind: 'query',
      dataSource: { limit: 12, isNewProduct: true },
      updatedAt: '2026-08-14T21:17:52.667Z',
    });

    expect(section.content).toMatchObject({
      title: { ar: 'منتجات جديدة', en: 'New arrivals' },
    });
    expect(section.dataSource).toMatchObject({
      kind: 'query',
      limit: 12,
      isNewProduct: true,
      sort: 'createdAt',
      sortDirection: 'desc',
    });
    expect(section.style).toMatchObject({
      layout: 'carousel',
      visibility: { mobile: true, tablet: true, desktop: true },
    });
  });
});

describe('mapStorefrontPage with normalized seed sections', () => {
  it('resolves product carousel heading for locale', () => {
    const section = normalizeCmsSectionDto({
      id: 'a5d95204-d0a4-48a5-8a0e-1ed61853dfe3',
      sectionType: 'product-carousel',
      status: 'published',
      enabled: true,
      sortOrder: 2,
      revision: 2,
      content: { titleAr: 'منتجات جديدة', titleEn: 'New arrivals' },
      settings: { limit: 12 },
      style: {},
      dataSourceKind: 'query',
      dataSource: { limit: 12, isNewProduct: true },
      updatedAt: '2026-08-14T21:17:52.667Z',
    });

    const page = mapStorefrontPage(
      {
        id: '967b31f4-a133-45b3-88af-c35464a9aea8',
        companyId: '13088934-0436-4529-b64d-97bafd05c9c3',
        pageType: 'homepage',
        slug: 'home',
        displayName: { ar: 'الرئيسية', en: 'Home' },
        schemaVersion: 1,
        contentVersion: 2,
        status: 'published',
        createdAt: '2026-08-14T21:15:05.139Z',
        updatedAt: '2026-08-14T21:17:52.667Z',
        publishedAt: '2026-08-14T21:15:05.263Z',
        createdBy: null,
        updatedBy: null,
        sections: [section],
      },
      'ar',
    );

    expect(page.sections[0]?.type).toBe('product-carousel');
    if (page.sections[0]?.type === 'product-carousel') {
      expect(page.sections[0].heading.title).toBe('منتجات جديدة');
    }
  });
});
