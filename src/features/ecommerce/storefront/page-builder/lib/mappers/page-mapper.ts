import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import { resolveLocalizedOptional, resolveLocalizedText } from '@/features/ecommerce/storefront/domain/localizable';
import type { StorefrontHeroSlide, StorefrontHomepageFeature } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type {
  NormalizedSection,
  ResolvedSectionHeading,
  StorefrontPage,
} from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { SectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import type { StorefrontLocale } from '@/i18n/routing';
import { withDefaultSectionVisibility } from '@/features/ecommerce/storefront/page-builder/domain/section-style';
import { resolveStorefrontImageSrc } from '@/features/ecommerce/storefront/lib/resolve-storefront-image-src';

function resolveHeadingField(
  content: { title?: LocalizableString | null; subtitle?: LocalizableString | null },
  key: 'title' | 'subtitle',
): LocalizableString | null {
  const nested = content[key];
  if (nested) return nested;

  const legacy = content as Record<string, unknown>;
  const ar = legacy[`${key}Ar`];
  const en = legacy[`${key}En`];
  if (typeof ar === 'string' || typeof en === 'string') {
    return {
      ar: typeof ar === 'string' ? ar : '',
      en: typeof en === 'string' ? en : '',
    };
  }
  return null;
}

function mapHeading(
  content: { title?: LocalizableString | null; subtitle?: LocalizableString | null },
  locale: StorefrontLocale,
): ResolvedSectionHeading {
  const title = resolveHeadingField(content, 'title');
  const subtitle = resolveHeadingField(content, 'subtitle');
  return {
    title: resolveLocalizedOptional(title ?? undefined, locale) ?? '',
    subtitle: resolveLocalizedOptional(subtitle ?? undefined, locale) ?? '',
  };
}

function mapSectionStyle<T extends SectionRecord['style']>(style: T): T {
  return withDefaultSectionVisibility(style) as T;
}

function mapSectionRecord(section: SectionRecord, locale: StorefrontLocale): NormalizedSection | null {
  const style = mapSectionStyle(section.style);
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
        heading: mapHeading(section.content, locale),
        content: section.content,
        settings: section.settings,
        style,
        dataSource: section.dataSource,
      };
    case 'category-grid':
      return {
        ...base,
        type: 'category-grid',
        heading: mapHeading(section.content, locale),
        content: section.content,
        settings: section.settings,
        style,
        dataSource: section.dataSource,
      };
    case 'product-carousel':
      return {
        ...base,
        type: 'product-carousel',
        heading: mapHeading(section.content, locale),
        content: section.content,
        settings: section.settings,
        style,
        dataSource: section.dataSource,
      };
    case 'flash-sale':
      return {
        ...base,
        type: 'flash-sale',
        heading: mapHeading(section.content, locale),
        content: section.content,
        settings: section.settings,
        style,
        dataSource: section.dataSource,
      };
    case 'features-grid':
      return {
        ...base,
        type: 'features-grid',
        heading: mapHeading(section.content, locale),
        content: section.content,
        settings: section.settings,
        style,
        dataSource: section.dataSource,
      };
    case 'brand-slider':
      return {
        ...base,
        type: 'brand-slider',
        heading: mapHeading(section.content, locale),
        content: section.content,
        settings: section.settings,
        style,
        dataSource: section.dataSource,
      };
    case 'banner':
      return {
        ...base,
        type: 'banner',
        heading: { title: '', subtitle: '' },
        content: section.content,
        settings: section.settings,
        style,
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
  return section.content.slides
    .filter((slide) => slide.enabled !== false)
    .map((slide) => {
      const title = resolveLocalizedOptional(slide.title, locale) ?? '';
      const alt = resolveLocalizedOptional(slide.alt, locale) ?? title;
      const imageUrl = resolveStorefrontImageSrc(slide.imageUrl) ?? '';
      const mobileImageUrl = resolveStorefrontImageSrc(slide.mobileImageUrl);
      return {
        id: slide.id,
        imageUrl,
        mobileImageUrl,
        title,
        alt,
        href: slide.href ?? null,
      };
    })
    .filter((slide) => slide.imageUrl || slide.mobileImageUrl);
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
    .filter((section) => section.type !== 'features-grid')
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
