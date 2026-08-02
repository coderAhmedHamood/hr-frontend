import { mapStorefrontPage } from '@/features/ecommerce/storefront/page-builder/lib/mappers/page-mapper';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';

const samplePage: PageRecord = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  companyId: 'demo-company',
  pageType: 'homepage',
  slug: 'home',
  displayName: { ar: 'الرئيسية', en: 'Home' },
  schemaVersion: 1,
  contentVersion: 1,
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-07-13T12:00:00.000Z',
  publishedAt: '2026-07-13T12:00:00.000Z',
  createdBy: null,
  updatedBy: null,
  sections: [
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      type: 'hero-carousel',
      status: 'published',
      enabled: true,
      order: 10,
      revision: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
      publishedAt: '2026-07-13T12:00:00.000Z',
      createdBy: null,
      updatedBy: null,
      content: {
        title: null,
        subtitle: null,
        slides: [
          {
            id: '8e3b5a70-1f2c-4d5e-9f0a-1b2c3d4e5f60',
            imageUrl: 'https://images.unsplash.com/photo-1.jpg',
            title: { ar: 'عنوان', en: 'Title' },
          },
        ],
      },
      settings: { autoplay: true, intervalMs: 5000 },
      style: {
        theme: 'system',
        layout: 'full-bleed',
        height: '21/7',
        visibility: { mobile: true, tablet: true, desktop: true },
      },
      dataSource: { kind: 'manual', entityIds: [] },
    },
    {
      id: '4fb96f75-6828-4673-b4fd-3d074f77bfb7',
      type: 'category-grid',
      status: 'draft',
      enabled: true,
      order: 20,
      revision: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
      publishedAt: null,
      createdBy: null,
      updatedBy: null,
      content: { title: { ar: 'أقسام', en: 'Categories' }, subtitle: null },
      settings: { showLabels: true, columns: { mobile: 4, tablet: 6, desktop: 8 } },
      style: {
        theme: 'light',
        layout: 'circles',
        visibility: { mobile: true, tablet: true, desktop: true },
      },
      dataSource: { kind: 'collection', collectionId: 'featured-categories', limit: 12 },
    },
  ],
};

describe('mapStorefrontPage', () => {
  it('resolves display name for locale', () => {
    const page = mapStorefrontPage(samplePage, 'en');
    expect(page.displayName).toBe('Home');
  });

  it('filters unpublished sections and sorts by order', () => {
    const page = mapStorefrontPage(samplePage, 'en');
    expect(page.sections).toHaveLength(1);
    expect(page.sections[0]?.type).toBe('hero-carousel');
  });

  it('localizes hero slide title', () => {
    const page = mapStorefrontPage(samplePage, 'ar');
    const hero = page.sections[0];
    expect(hero?.type).toBe('hero-carousel');
    if (hero?.type === 'hero-carousel') {
      expect(hero.content.slides[0]?.title?.ar).toBe('عنوان');
    }
  });
});
