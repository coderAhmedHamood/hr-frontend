# Section Definition System — Backend Contract

**Audience:** Backend engineers implementing CMS APIs  
**Frontend source of truth:** `src/features/ecommerce/storefront/page-builder/definitions/`  
**Runtime validation:** `src/features/ecommerce/storefront/page-builder/schemas/page.schema.ts` (Zod)

---

## Purpose

Every storefront section type is described by a **SectionDefinition** object. The Admin Dashboard will generate editing forms from `fields[]` and `capabilities`. The backend should mirror the same DTO shapes and validation rules documented here.

**JSON-serializable manifest (no Zod):** call `getSectionDefinitionManifest()` from `lib/section-definition-registry.ts`.

---

## Core Types

### LocalizableString

```ts
type LocalizableString = { ar: string; en: string };
```

All user-facing CMS copy uses this shape. Storefront resolves to a single locale at render time.

### SectionMetadata (every section)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `uuid` | yes | Stable section instance id |
| `status` | `draft \| published \| archived` | yes | Publishing workflow |
| `enabled` | `boolean` | yes | Soft toggle without delete |
| `order` | `integer` | yes | Sort key on page |
| `revision` | `integer ≥ 1` | yes | Optimistic concurrency |
| `createdAt` | `datetime` | yes | ISO-8601 |
| `updatedAt` | `datetime` | yes | ISO-8601 |
| `publishedAt` | `datetime \| null` | yes | null when never published |
| `createdBy` | `uuid \| null` | yes | Admin user |
| `updatedBy` | `uuid \| null` | yes | Admin user |

### SectionStyleCore

| Field | Type | Required |
|-------|------|----------|
| `theme` | `light \| dark \| system` | yes |
| `visibility.mobile` | `boolean` | yes |
| `visibility.tablet` | `boolean` | yes |
| `visibility.desktop` | `boolean` | yes |

Each section adds a **typed** `layout` enum — see Layout Enums below.

### DataSource (discriminated union on `kind`)

| kind | Fields | Used by |
|------|--------|---------|
| `manual` | `entityIds: uuid[]` | hero, features, banner, optional elsewhere |
| `category` | `categoryId: uuid`, `limit: 1–24` | product-carousel |
| `tag` | `tag: string`, `limit: 1–24` | flash-sale, product-carousel |
| `collection` | `collectionId: string`, `limit: 1–24` | category-grid, brand-slider, product-carousel |
| `query` | `sort`, `sortDirection`, `limit`, `categoryId?`, `tag?` | category-grid, product-carousel, flash-sale |
| `recommendation` | `slot: string`, `limit: 1–24` | product-carousel (future) |

---

## Layout Enums (no free-form strings)

| Section type | Allowed `style.layout` values |
|--------------|------------------------------|
| `hero-carousel` | `full-bleed`, `contained` |
| `category-grid` | `circles`, `cards`, `list` |
| `product-carousel` | `carousel`, `grid` |
| `flash-sale` | `carousel`, `grid`, `highlight` |
| `features-grid` | `four-column`, `three-column`, `two-column` |
| `brand-slider` | `slider`, `grid` |
| `banner` | `contained`, `full-bleed`, `split` |

TypeScript: `domain/layout-types.ts`  
Zod: per-section schema in `schemas/page.schema.ts`

---

## Section DTOs

### hero-carousel

**Schema id:** `storefront.section.hero-carousel.v1`

```ts
type HeroCarouselSectionDto = SectionMetadata & {
  type: 'hero-carousel';
  content: {
    title: LocalizableString | null;
    subtitle: LocalizableString | null;
    slides: Array<{
      id: uuid;
      imageUrl: url;
      mobileImageUrl?: url;
      title?: LocalizableString;
      alt?: LocalizableString;
      href?: `/store${string}`;
    }>; // min 1
  };
  settings: { autoplay: boolean; intervalMs: 1000–30000 };
  style: SectionStyleCore & { layout: HeroCarouselLayout; height: string };
  dataSource: { kind: 'manual'; entityIds: uuid[] };
};
```

### category-grid

**Schema id:** `storefront.section.category-grid.v1`

```ts
type CategoryGridSectionDto = SectionMetadata & {
  type: 'category-grid';
  content: { title: LocalizableString | null; subtitle: LocalizableString | null };
  settings: {
    showLabels: boolean;
    columns: { mobile: 2–12; tablet: 2–12; desktop: 2–12 };
  };
  style: SectionStyleCore & { layout: CategoryGridLayout };
  dataSource: ManualDataSource | CollectionDataSource | QueryDataSource;
};
```

### product-carousel

**Schema id:** `storefront.section.product-carousel.v1`

```ts
type ProductCarouselSectionDto = SectionMetadata & {
  type: 'product-carousel';
  content: {
    title: LocalizableString | null;
    subtitle: LocalizableString | null;
    viewAllHref: `/store${string}` | null;
  };
  settings: { autoplay: boolean; showPrice: boolean; showBadge: boolean };
  style: SectionStyleCore & { layout: ProductCarouselLayout };
  dataSource: Manual | Query | Tag | Category | Collection | Recommendation;
};
```

### flash-sale

**Schema id:** `storefront.section.flash-sale.v1`

```ts
type FlashSaleSectionDto = SectionMetadata & {
  type: 'flash-sale';
  content: {
    title: LocalizableString | null;
    subtitle: LocalizableString | null;
    viewAllHref: `/store${string}` | null;
  };
  settings: {
    showPrice: boolean;
    showCountdown: boolean;
    endsAt: datetime | null;
  };
  style: SectionStyleCore & { layout: FlashSaleLayout };
  dataSource: TagDataSource | QueryDataSource;
};
```

### features-grid

**Schema id:** `storefront.section.features-grid.v1`

```ts
type FeaturesGridSectionDto = SectionMetadata & {
  type: 'features-grid';
  content: {
    title: LocalizableString | null;
    subtitle: LocalizableString | null;
    items: Array<{
      id: uuid;
      icon: 'truck' | 'shield' | 'sparkles' | 'headphones';
      title: LocalizableString;
      description: LocalizableString;
    }>; // max 8
  };
  settings: {
    columns: { mobile: 1–4; tablet: 1–4; desktop: 1–4 };
  };
  style: SectionStyleCore & { layout: FeaturesGridLayout };
  dataSource: { kind: 'manual'; entityIds: uuid[] };
};
```

### brand-slider

**Schema id:** `storefront.section.brand-slider.v1`

```ts
type BrandSliderSectionDto = SectionMetadata & {
  type: 'brand-slider';
  content: {
    title: LocalizableString | null;
    subtitle: LocalizableString | null;
    viewAllHref: `/store${string}` | null;
  };
  settings: { showLogo: boolean };
  style: SectionStyleCore & { layout: BrandSliderLayout };
  dataSource: ManualDataSource | CollectionDataSource;
};
```

### banner

**Schema id:** `storefront.section.banner.v1`

```ts
type BannerSectionDto = SectionMetadata & {
  type: 'banner';
  content: {
    imageUrl: url;
    mobileImageUrl: url | null;
    alt: LocalizableString;
    href: `/store${string}`;
    target: '_self' | '_blank';
  };
  settings: Record<string, never>;
  style: SectionStyleCore & { layout: BannerLayout };
  dataSource: { kind: 'manual'; entityIds: uuid[] };
};
```

---

## Page DTO

**Schema:** `pageRecordSchema` in `schemas/page.schema.ts`

```ts
type StorefrontPageDto = {
  id: uuid;
  companyId: string;
  pageType: 'homepage' | 'category-landing' | 'brand-page' | 'campaign' | 'offer' | 'custom';
  slug: string;
  displayName: LocalizableString;
  schemaVersion: integer ≥ 1;
  contentVersion: integer ≥ 1;
  status: 'draft' | 'published' | 'archived';
  createdAt: datetime;
  updatedAt: datetime;
  publishedAt: datetime | null;
  createdBy: uuid | null;
  updatedBy: uuid | null;
  sections: SectionRecordDto[]; // discriminated union on `type`
};
```

---

## FieldDefinition (admin form generation)

Each section exposes `fields: FieldDefinition[]`:

| Property | Purpose |
|----------|---------|
| `key` | Stable field identifier |
| `path` | Dot-path into section JSON (`content.title`) |
| `label` / `description` | `LocalizableString` for admin UI |
| `control` | Widget type: `localized-text`, `image`, `category-picker`, etc. |
| `localized` | Whether value is `LocalizableString` |
| `required` | Form + API required flag |
| `group` | `content \| settings \| style \| dataSource \| metadata` |
| `validation` | `min`, `max`, `minLength`, `maxLength`, `pattern` |
| `defaultValue` | Seed for new sections |
| `meta` | Control-specific options (aspect ratio, picker mode, etc.) |

**Rule:** Admin must not hardcode per-section forms. Read `fields[]` from the definition manifest.

---

## SectionCapabilities

Boolean flags on each definition — admin reads capabilities instead of inferring from `type`:

`supportsTitle`, `supportsSubtitle`, `supportsBackground`, `supportsSpacing`, `supportsContainer`, `supportsAnimation`, `supportsAutoplay`, `supportsProducts`, `supportsCategories`, `supportsBrands`, `supportsBanners`, `supportsCountdown`, `supportsFilters`, `supportsPagination`, `supportsRecommendations`, `supportsScheduling`, `supportsDraft`, `supportsPreview`, `supportsAnalytics`, `supportsTheme`, `supportsVisibilityRules`

---

## Adding a New Section (contract checklist)

1. Add layout enum to `domain/layout-types.ts`
2. Add `*Config` + record types to `domain/section-types.ts`
3. Add Zod schema to `schemas/page.schema.ts` and register in `sectionRecordSchema`
4. Create `definitions/{type}.definition.ts` with fields + capabilities
5. Register in `lib/section-definition-registry.ts`
6. Add renderer component + entry in `lib/section-registry.tsx`
7. Document DTO in this file

**Do not modify** `components/storefront-page.tsx` — it only maps `sections[]`.

---

## Repository Swap

Only `lib/repositories/page-repository.ts` changes when moving from static JSON to API. Definitions and Zod schemas remain the frontend validation contract; backend should return payloads that pass `pageRecordSchema`.
