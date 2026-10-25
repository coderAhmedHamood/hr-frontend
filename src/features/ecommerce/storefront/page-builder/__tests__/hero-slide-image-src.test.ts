import { normalizeCmsSectionDto } from '@/features/ecommerce/storefront/page-builder/lib/normalize-cms-section-dto';
import { heroCarouselSectionSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';

const SLIDE_UPLOADED = {
  id: '00000000-0000-4000-8000-000000000003',
  imageUrl: '/uploads/images/slide.png',
  mobileImageUrl: '/uploads/images/slide-mobile.png',
  fit: 'contain',
  position: 'top',
  enabled: true,
};

function heroDto(slides: unknown[]) {
  return normalizeCmsSectionDto({
    id: 'a5d95204-d0a4-48a5-8a0e-1ed61853dfe3',
    sectionType: 'hero-carousel',
    status: 'published',
    enabled: true,
    sortOrder: 0,
    revision: 1,
    content: { slides },
    settings: { autoplay: true, intervalMs: 5000 },
    style: { layout: 'contained', height: '21/7' },
    dataSourceKind: 'manual',
    dataSource: { entityIds: [] },
    updatedAt: '2026-10-25T00:00:00.000Z',
  });
}

// Bug 2026-10-25: an uploaded slide image is stored as `/uploads/...`; saving
// failed with "slides.2.imageUrl: Invalid URL" and reading dropped the slide.
describe('hero slide image source', () => {
  it('keeps an uploaded slide (stored path) with its display options', () => {
    const section = heroDto([
      { id: '00000000-0000-4000-8000-000000000001', imageUrl: 'https://cdn.example.com/a.jpg' },
      SLIDE_UPLOADED,
    ]);
    const slides = (section.content as { slides: Array<Record<string, unknown>> }).slides;
    expect(slides).toHaveLength(2);
    expect(slides[1]).toMatchObject(SLIDE_UPLOADED);
    expect(heroCarouselSectionSchema.safeParse(section).success).toBe(true);
  });

  it('still drops unusable sources and unknown display options', () => {
    const section = heroDto([
      { id: '00000000-0000-4000-8000-000000000001', imageUrl: '//evil.example.com/a.jpg' },
      { id: '00000000-0000-4000-8000-000000000002', imageUrl: 'javascript:alert(1)' },
      { ...SLIDE_UPLOADED, fit: 'stretch', position: 'left' },
    ]);
    const slides = (section.content as { slides: Array<Record<string, unknown>> }).slides;
    expect(slides).toHaveLength(1);
    expect(slides[0].fit).toBeUndefined();
    expect(slides[0].position).toBeUndefined();
  });
});
