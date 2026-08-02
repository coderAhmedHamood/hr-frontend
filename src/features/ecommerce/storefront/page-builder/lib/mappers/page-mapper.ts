import { resolveLocalizedOptional, resolveLocalizedText } from '@/features/ecommerce/storefront/domain/localizable';
import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import type { StorefrontHeroSlide, StorefrontHomepageFeature } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type {
  NormalizedSection,
  ResolvedSectionHeading,
  StorefrontPage,
} from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { SectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import type { StorefrontLocale } from '@/i18n/routing';

function mapHeading(
  title: LocalizableString | null,
  subtitle: LocalizableString | null,
  locale: StorefrontLocale,
): ResolvedSectionHeading {
  return {
    title: resolveLocalizedOptional(title ?? undefined, locale) ?? '',
    subtitle: resolveLocalizedOptional(subtitle ?? undefined, locale) ?? '',
  };
}

function mapSectionRecord(section: SectionRecord, locale: StorefrontLocale): NormalizedSection | null {
  const base = {
    id: section.id,
    type: section.type,
    order: section.order,
    dataSource: section.dataSource,
  };

  switch (section.type) {
    case 'hero-carousel':
      return {
        ...base,
        type: 'hero-carousel',
        heading: mapHeading(section.content.title, section.content.subtitle, locale),
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSource: section.dataSource,
      };
    case 'category-grid':
      return {
        ...base,
        type: 'category-grid',
        heading: mapHeading(section.content.title, section.content.subtitle, locale),
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSource: section.dataSource,
      };
    case 'product-carousel':
      return {
        ...base,
        type: 'product-carousel',
        heading: mapHeading(section.content.title, section.content.subtitle, locale),
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSource: section.dataSource,
      };
    case 'flash-sale':
      return {
        ...base,
        type: 'flash-sale',
        heading: mapHeading(section.content.title, section.content.subtitle, locale),
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSource: section.dataSource,
      };
    case 'features-grid':
      return {
        ...base,
        type: 'features-grid',
        heading: mapHeading(section.content.title, section.content.subtitle, locale),
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSource: section.dataSource,
      };
    case 'brand-slider':
      return {
        ...base,
        type: 'brand-slider',
        heading: mapHeading(section.content.title, section.content.subtitle, locale),
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSource: section.dataSource,
      };
    case 'banner':
      return {
        ...base,
        type: 'banner',
        heading: { title: '', subtitle: '' },
        content: section.content,
        settings: section.settings,
        style: section.style,
        dataSource: section.dataSource,
      };
    default:
      return null;
  }
}

export function mapHeroSlides(
  section: Extract<NormalizedSection, { type: 'hero-carousel' }>,
  locale: StorefrontLocale,
): StorefrontHeroSlide[] {
  return section.content.slides.map((slide) => {
    const title = resolveLocalizedOptional(slide.title, locale) ?? '';
    const alt = resolveLocalizedOptional(slide.alt, locale) ?? title;
    return {
      id: slide.id,
      imageUrl: slide.imageUrl,
      mobileImageUrl: slide.mobileImageUrl ?? null,
      title,
      alt,
      href: slide.href ?? null,
    };
  });
}

export function mapFeatureItems(
  section: Extract<NormalizedSection, { type: 'features-grid' }>,
  locale: StorefrontLocale,
): StorefrontHomepageFeature[] {
  return section.content.items.map((item) => ({
    id: item.id,
    title: resolveLocalizedText(item.title, locale),
    description: resolveLocalizedText(item.description, locale),
    icon: item.icon,
  }));
}

export function mapStorefrontPage(record: PageRecord, locale: StorefrontLocale): StorefrontPage {
  const sections = record.sections
    .filter((section) => section.enabled && section.status === 'published')
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map((section) => mapSectionRecord(section, locale))
    .filter((section): section is NormalizedSection => section !== null);

  return {
    id: record.id,
    companyId: record.companyId,
    pageType: record.pageType,
    slug: record.slug,
    schemaVersion: record.schemaVersion,
    contentVersion: record.contentVersion,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    displayName: resolveLocalizedText(record.displayName, locale),
    sections,
  };
}
