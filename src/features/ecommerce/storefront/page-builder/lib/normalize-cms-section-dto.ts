import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import type { DataSourceConfig, DataSourceKind } from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import type { SectionRecord, SectionType } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import { getSectionDefinition } from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';
import { withDefaultSectionVisibility } from '@/features/ecommerce/storefront/page-builder/domain/section-style';

type CmsSectionDtoInput = {
  id: string;
  sectionType: SectionType;
  status: SectionRecord['status'];
  enabled: boolean;
  sortOrder: number;
  revision: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  style: Record<string, unknown>;
  dataSourceKind: DataSourceKind;
  dataSource: Record<string, unknown>;
  publishedAt?: string | null;
  updatedAt: string;
};

function readLocalizedField(
  record: Record<string, unknown>,
  key: 'title' | 'subtitle',
): LocalizableString | null {
  const nested = record[key];
  if (nested && typeof nested === 'object') {
    const obj = nested as Record<string, unknown>;
    if (typeof obj.ar === 'string' || typeof obj.en === 'string') {
      return {
        ar: typeof obj.ar === 'string' ? obj.ar : '',
        en: typeof obj.en === 'string' ? obj.en : '',
      };
    }
  }

  const ar = record[`${key}Ar`];
  const en = record[`${key}En`];
  if (typeof ar === 'string' || typeof en === 'string') {
    return {
      ar: typeof ar === 'string' ? ar : '',
      en: typeof en === 'string' ? en : '',
    };
  }

  return null;
}

function normalizeSectionContent(type: SectionType, content: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...content };

  if (type !== 'banner') {
    const title = readLocalizedField(next, 'title');
    const subtitle = readLocalizedField(next, 'subtitle');
    if (title) next.title = title;
    if (subtitle) next.subtitle = subtitle;
    delete next.titleAr;
    delete next.titleEn;
    delete next.subtitleAr;
    delete next.subtitleEn;
  }

  if (type === 'hero-carousel' && Array.isArray(next.slides)) {
    next.slides = next.slides.map((slide, index) => {
      if (!slide || typeof slide !== 'object') return slide;
      const record = slide as Record<string, unknown>;
      const slideTitle = readLocalizedField(record, 'title');
      return {
        ...record,
        id: typeof record.id === 'string' ? record.id : `legacy-slide-${index}`,
        imageUrl: typeof record.imageUrl === 'string' ? record.imageUrl : '',
        mobileImageUrl:
          typeof record.mobileImageUrl === 'string' ? record.mobileImageUrl : undefined,
        enabled: record.enabled ?? true,
        ...(slideTitle ? { title: slideTitle } : {}),
      };
    });
  }

  if (type === 'banner') {
    const alt = readLocalizedField(next, 'alt');
    if (alt) next.alt = alt;
    delete next.altAr;
    delete next.altEn;
  }

  return next;
}

function normalizeSectionSettings(type: SectionType, settings: Record<string, unknown>): Record<string, unknown> {
  const defaults = getSectionDefinition(type).defaultConfiguration.settings as Record<string, unknown>;
  const next = { ...defaults, ...settings };

  if (type === 'category-grid' && typeof next.columns === 'number') {
    const columns = next.columns;
    next.columns = { mobile: columns, tablet: columns, desktop: columns };
  }

  return next;
}

function normalizeSectionStyle(type: SectionType, style: Record<string, unknown>): SectionRecord['style'] {
  const defaults = getSectionDefinition(type).defaultConfiguration.style as Record<string, unknown>;
  return withDefaultSectionVisibility({ ...defaults, ...style }) as SectionRecord['style'];
}

function normalizeDataSource(
  kind: DataSourceKind,
  dataSource: Record<string, unknown>,
  settings: Record<string, unknown>,
): DataSourceConfig {
  if (kind === 'query') {
    const limit =
      typeof dataSource.limit === 'number'
        ? dataSource.limit
        : typeof settings.limit === 'number'
          ? settings.limit
          : 12;

    return {
      kind: 'query',
      sort: (dataSource.sort as 'createdAt' | 'price' | 'sales' | 'name') ?? 'createdAt',
      sortDirection: (dataSource.sortDirection as 'asc' | 'desc') ?? 'desc',
      limit,
      categoryId: typeof dataSource.categoryId === 'string' ? dataSource.categoryId : null,
      tag: typeof dataSource.tag === 'string' ? dataSource.tag : null,
      isNewProduct: dataSource.isNewProduct === true ? true : null,
      isTodayDeal: dataSource.isTodayDeal === true ? true : null,
      isWholesale: dataSource.isWholesale === true ? true : null,
      isDiscounted: dataSource.isDiscounted === true ? true : null,
    };
  }

  if (kind === 'manual') {
    return {
      kind: 'manual',
      entityIds: Array.isArray(dataSource.entityIds)
        ? dataSource.entityIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
  }

  if (kind === 'collection') {
    return {
      kind: 'collection',
      collectionId: typeof dataSource.collectionId === 'string' ? dataSource.collectionId : 'featured',
      limit:
        typeof dataSource.limit === 'number'
          ? dataSource.limit
          : typeof settings.limit === 'number'
            ? settings.limit
            : 12,
    };
  }

  if (kind === 'category') {
    return {
      kind: 'category',
      categoryId: typeof dataSource.categoryId === 'string' ? dataSource.categoryId : '',
      limit: typeof dataSource.limit === 'number' ? dataSource.limit : 12,
    };
  }

  if (kind === 'tag') {
    return {
      kind: 'tag',
      tag: typeof dataSource.tag === 'string' ? dataSource.tag : '',
      limit: typeof dataSource.limit === 'number' ? dataSource.limit : 12,
    };
  }

  return {
    kind: 'recommendation',
    slot: typeof dataSource.slot === 'string' ? dataSource.slot : 'default',
    limit: typeof dataSource.limit === 'number' ? dataSource.limit : 12,
  };
}

/** Maps Nest CMS section payloads (incl. system:init seed shape) to storefront SectionRecord. */
export function normalizeCmsSectionDto(dto: CmsSectionDtoInput): SectionRecord {
  const type = dto.sectionType;
  const settings = normalizeSectionSettings(type, dto.settings ?? {});
  const content = normalizeSectionContent(type, dto.content ?? {});
  const now = dto.updatedAt || new Date().toISOString();

  return {
    id: dto.id,
    type,
    status: dto.status,
    enabled: dto.enabled,
    order: dto.sortOrder,
    revision: dto.revision,
    createdAt: now,
    updatedAt: now,
    publishedAt: dto.publishedAt ?? null,
    createdBy: null,
    updatedBy: null,
    content: content as SectionRecord['content'],
    settings: settings as SectionRecord['settings'],
    style: normalizeSectionStyle(type, dto.style ?? {}),
    dataSource: normalizeDataSource(dto.dataSourceKind, dto.dataSource ?? {}, settings),
  };
}
