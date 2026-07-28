# Inventory API — دليل الربط للـ Frontend

> مرجع الـ Backend لموديول المخزون. متوافق مع [`inventory-database-schema.md`](./inventory-database-schema.md).  
> الحقول في الـ JSON تكون **camelCase** (مثل `companyId`)، بينما في قاعدة البيانات **snake_case** (مثل `company_id`).

> **حفظ منتج بخصائص ومتغيرات؟** استخدم الواجهة المركّبة بدل عشرات الطلبات الذرّية:  
> [`inventory-products-full-api.md`](./inventory-products-full-api.md)  
> (`POST/GET/PATCH /inventory/products/…/full`)

---

## 1. أساسيات الربط

| البند | القيمة |
|------|--------|
| Base URL | `{HOST}/inventory/...` (لا يوجد prefix عام مثل `/api`) |
| Auth | `Authorization: Bearer <access_token>` |
| Content-Type | `application/json` |
| Path params | كل `:id` من نوع **UUID v4** |
| Validation | حقول غير معرّفة في الـ DTO → رفض الطلب |

### شكل الاستجابة الناجحة

```json
{
  "status": 200,
  "message": "...",
  "data": {},
  "error": null
}
```

### شكل القائمة (داخل `data`)

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 200,
    "total": 0,
    "totalPages": 0
  }
}
```

### شكل الخطأ

```json
{
  "status": 400,
  "message": "...",
  "data": null,
  "error": {}
}
```

### ملاحظات عامة

- **DELETE** الناجح غالباً يعيد **HTTP 204** بدون body (أرشفة ناعمة Soft Archive).
- الحقول الرقمية العشرية في الـ Response غالباً تأتي كـ **string** (مثل `"12.5000"`).
- معظم القوائم تدعم:
  - `page` (افتراضي `1`)
  - `limit` (افتراضي `200`)
  - `archiveScope`: `active` | `archived` | `all` (افتراضي `active`)
- استثناءات بدون `archiveScope`:
  - `/inventory/product-variant-attribute-values`
  - `/inventory/ledger-entries`

---

## 2. الـ Enums (مطابقة للـ Schema)

| Enum | القيم |
|------|--------|
| `WarehouseStatus` | `active`, `inactive` |
| `WarehouseLocationType` | `internal`, `view`, `supplier`, `customer`, `inventory`, `production`, `transit` |
| `WarehouseRemovalStrategy` | `fifo`, `lifo`, `closest`, `fewest_packages`, `fefo` |
| `WarehouseOperationKind` | `transfer`, `receipt`, `issue`, `internal`, `adjustment`, `physical_count`, `scrap`, `purchase`, `replenishment` |
| `WarehouseOperationStatus` | `draft`, `ready`, `done`, `cancelled` |
| `ProductStatus` | `draft`, `active`, `archived` |
| `StockStatus` | `in_stock`, `out_of_stock`, `preorder`, `discontinued` |
| `ProductType` | `goods`, `service`, `combo` |
| `ProductTracking` | `none`, `lot`, `serial` |
| `ProductInvoicePolicy` | `ordered`, `delivered` |
| `PackagingType` | `unit`, `pack`, `box`, `pallet`, `other` |
| `MediaType` | `image`, `video` |
| `AttributeDisplayType` | `radio`, `pills`, `select`, `color`, `image`, `multi` |
| `VariantCreationMode` | `always`, `dynamic`, `never` |
| `PutawayAppliesTo` | `product`, `category`, `all` |
| `CategoryPackageReservation` | `full`, `partial` |
| `ArchiveScope` | `active`, `archived`, `all` |

---

## 3. خريطة الجداول ↔ الـ Endpoints

| جدول Schema | Endpoint | CRUD |
|-------------|----------|------|
| `categories` | `/inventory/categories` | كامل |
| `catalog_attributes` | `/inventory/catalog-attributes` | كامل |
| `catalog_attribute_values` | `/inventory/catalog-attribute-values` | كامل |
| `products` | `/inventory/products` | كامل |
| `product_media` | `/inventory/product-media` | كامل |
| `product_uom_lines` | `/inventory/product-uom-lines` | كامل |
| `product_attribute_lines` | `/inventory/product-attribute-lines` | كامل |
| `product_attribute_values` | `/inventory/product-attribute-values` | كامل |
| `product_variants` | `/inventory/product-variants` | كامل |
| `product_variant_attribute_values` | `/inventory/product-variant-attribute-values` | كامل (DELETE صلب) |
| `warehouses` | `/inventory/warehouses` | كامل |
| `warehouse_locations` | `/inventory/warehouse-locations` | كامل |
| `warehouse_operations` | `/inventory/warehouse-operations` | كامل |
| `warehouse_operation_lines` | `/inventory/warehouse-operation-lines` | كامل |
| `inventory_ledger_entries` | `/inventory/ledger-entries` | Create + Read فقط |
| `putaway_rules` | `/inventory/putaway-rules` | كامل |
| `location_stock` | — | **لا يوجد API حالياً** |
| `brands` | — | **لا يوجد API في موديول inventory** (يُمرَّر `brandId` فقط في المنتجات) |

---

## 4. الصلاحيات (Permissions)

كل طلب يحتاج JWT + صلاحية مناسبة:

| المورد | create | read | update | delete |
|--------|--------|------|--------|--------|
| Categories | `inv.catalog.categories.create` | `inv.catalog.categories.read` | `inv.catalog.categories.update` | `inv.catalog.categories.delete` |
| Catalog Attributes | `inv.catalog.attributes.create` | `inv.catalog.attributes.read` | `inv.catalog.attributes.update` | `inv.catalog.attributes.delete` |
| Catalog Attribute Values | `inv.catalog.attribute-values.create` | `inv.catalog.attribute-values.read` | `inv.catalog.attribute-values.update` | `inv.catalog.attribute-values.delete` |
| Products | `inv.catalog.products.create` | `inv.catalog.products.read` | `inv.catalog.products.update` | `inv.catalog.products.delete` |
| Product Media | `inv.catalog.product-media.create` | `inv.catalog.product-media.read` | `inv.catalog.product-media.update` | `inv.catalog.product-media.delete` |
| Product UOM Lines | `inv.catalog.product-uom-lines.create` | `inv.catalog.product-uom-lines.read` | `inv.catalog.product-uom-lines.update` | `inv.catalog.product-uom-lines.delete` |
| Product Attribute Lines | `inv.catalog.product-attribute-lines.create` | `inv.catalog.product-attribute-lines.read` | `inv.catalog.product-attribute-lines.update` | `inv.catalog.product-attribute-lines.delete` |
| Product Attribute Values | `inv.catalog.product-attribute-values.create` | `inv.catalog.product-attribute-values.read` | `inv.catalog.product-attribute-values.update` | `inv.catalog.product-attribute-values.delete` |
| Product Variants | `inv.catalog.product-variants.create` | `inv.catalog.product-variants.read` | `inv.catalog.product-variants.update` | `inv.catalog.product-variants.delete` |
| Variant Attribute Values | `inv.catalog.product-variant-attribute-values.create` | `inv.catalog.product-variant-attribute-values.read` | `inv.catalog.product-variant-attribute-values.update` | `inv.catalog.product-variant-attribute-values.delete` |
| Warehouses | `inv.warehouse.warehouses.create` | `inv.warehouse.warehouses.read` | `inv.warehouse.warehouses.update` | `inv.warehouse.warehouses.delete` |
| Warehouse Locations | `inv.warehouse.locations.create` | `inv.warehouse.locations.read` | `inv.warehouse.locations.update` | `inv.warehouse.locations.delete` |
| Warehouse Operations | `inv.warehouse.operations.create` | `inv.warehouse.operations.read` | `inv.warehouse.operations.update` | `inv.warehouse.operations.delete` |
| Operation Lines | `inv.warehouse.operation-lines.create` | `inv.warehouse.operation-lines.read` | `inv.warehouse.operation-lines.update` | `inv.warehouse.operation-lines.delete` |
| Ledger | `inv.warehouse.ledger.create` | `inv.warehouse.ledger.read` | — | — |
| Putaway Rules | `inv.warehouse.putaway-rules.create` | `inv.warehouse.putaway-rules.read` | `inv.warehouse.putaway-rules.update` | `inv.warehouse.putaway-rules.delete` |

---

## 5. Categories — `/inventory/categories`

جدول Schema: `categories`

| Method | Path | Permission | Status |
|--------|------|------------|--------|
| POST | `/inventory/categories` | create | 201 |
| GET | `/inventory/categories` | read | 200 (paginated) |
| GET | `/inventory/categories/:id` | read | 200 |
| PATCH | `/inventory/categories/:id` | update | 200 |
| DELETE | `/inventory/categories/:id` | delete | 204 (soft archive) |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `companyId` | نعم | uuid | |
| `parentId` | لا | uuid \| null | فئة أب |
| `slug` | لا | string 1–160 | يُولَّد من `nameAr` إن لم يُرسل |
| `nameAr` | نعم | string 1–255 | |
| `nameEn` | لا | string ≤255 \| null | |
| `description` | لا | string \| null | |
| `imageUrl` | لا | string \| null | |
| `imageAlt` | لا | string ≤255 \| null | |
| `featuredBrandIds` | لا | uuid[] \| null | فريد |
| `seoMetaTitle` | لا | string ≤255 \| null | |
| `seoMetaDescription` | لا | string \| null | |
| `seoCanonicalPath` | لا | string ≤500 \| null | |
| `seoOgImage` | لا | string \| null | |
| `seoKeywords` | لا | string[] \| null | |
| `displayOrder` | لا | int ≥0 | افتراضي `0` |
| `isActive` | لا | boolean | افتراضي `true` |
| `logisticsRoutesNote` | لا | string \| null | |
| `logisticsRemovalStrategy` | لا | `WarehouseRemovalStrategy` \| null | |
| `logisticsPackageReservation` | لا | `CategoryPackageReservation` \| null | |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

نفس حقول Create **بدون** `companyId`، مع `updatedBy` بدل `createdBy`. كل الحقول اختيارية.

### Query Filters

`page`, `limit`, `archiveScope`,  
`companyId`, `parentId`, `rootOnly` (boolean), `id`,  
`slug`, `slugContains`, `nameAr`, `nameArContains`, `nameEn`, `nameEnContains`,  
`descriptionContains`, `imageUrlContains`, `imageAltContains`,  
`featuredBrandIds` (UUIDs مفصولة بفاصلة),  
`seoMetaTitleContains`, `seoMetaDescriptionContains`, `seoCanonicalPathContains`, `seoOgImageContains`,  
`seoKeywords` (مفصولة بفاصلة),  
`displayOrder`, `displayOrderMin`, `displayOrderMax`, `isActive`,  
`logisticsRoutesNoteContains`, `logisticsRemovalStrategy`, `logisticsPackageReservation`,  
`search`

### Response Fields

`id`, `companyId`, `parentId`, `slug`, `nameAr`, `nameEn`, `description`, `imageUrl`, `imageAlt`, `featuredBrandIds`, `seoMetaTitle`, `seoMetaDescription`, `seoCanonicalPath`, `seoOgImage`, `seoKeywords`, `displayOrder`, `isActive`, `logisticsRoutesNote`, `logisticsRemovalStrategy`, `logisticsPackageReservation`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 6. Catalog Attributes — `/inventory/catalog-attributes`

جدول Schema: `catalog_attributes`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/catalog-attributes` | create |
| GET | `/inventory/catalog-attributes` | read |
| GET | `/inventory/catalog-attributes/:id` | read |
| PATCH | `/inventory/catalog-attributes/:id` | update |
| DELETE | `/inventory/catalog-attributes/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `companyId` | نعم | uuid | |
| `nameAr` | نعم | string 1–255 | |
| `displayType` | لا | `AttributeDisplayType` | افتراضي `select` |
| `createVariant` | لا | `VariantCreationMode` | افتراضي `always` |
| `isActive` | لا | boolean | افتراضي `true` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

`nameAr`, `displayType`, `createVariant`, `isActive`, `updatedBy` — كلها اختيارية.

### Query Filters

`page`, `limit`, `archiveScope`, `companyId`, `id`, `nameAr`, `nameArContains`, `displayType`, `createVariant`, `isActive`, `search`

### Response Fields

`id`, `companyId`, `nameAr`, `displayType`, `createVariant`, `isActive`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 7. Catalog Attribute Values — `/inventory/catalog-attribute-values`

جدول Schema: `catalog_attribute_values`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/catalog-attribute-values` | create |
| GET | `/inventory/catalog-attribute-values` | read |
| GET | `/inventory/catalog-attribute-values/:id` | read |
| PATCH | `/inventory/catalog-attribute-values/:id` | update |
| DELETE | `/inventory/catalog-attribute-values/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `attributeId` | نعم | uuid | الأب |
| `nameAr` | نعم | string 1–255 | |
| `freeText` | لا | string \| null | |
| `defaultExtraPrice` | لا | number ≥0 (حتى 4 منازل) \| null | |
| `colorHex` | لا | `#RGB` / `#RRGGBB` / `#RRGGBBAA` \| null | |
| `imageUrl` | لا | string \| null | |
| `sortOrder` | لا | int ≥0 | افتراضي `0` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

كل حقول Create ما عدا `attributeId`، مع `updatedBy`. كلها اختيارية.

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `attributeId`, `companyId`, `nameAr`, `nameArContains`, `freeTextContains`, `colorHex`, `imageUrlContains`, `sortOrder`, `sortOrderMin`, `sortOrderMax`, `defaultExtraPriceMin`, `defaultExtraPriceMax`, `search`

### Response Fields

`id`, `attributeId`, `companyId`, `nameAr`, `freeText`, `defaultExtraPrice` (**string** \| null), `colorHex`, `imageUrl`, `sortOrder`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 8. Products — `/inventory/products`

جدول Schema: `products`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/products` | create |
| GET | `/inventory/products` | read |
| GET | `/inventory/products/:id` | read |
| PATCH | `/inventory/products/:id` | update |
| DELETE | `/inventory/products/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | افتراضي / ملاحظات |
|-------|-------|------|-------------------|
| `companyId` | نعم | uuid | |
| `brandId` | لا | uuid \| null | من نظام Brands خارجي |
| `categoryId` | لا | uuid \| null | |
| `sku` | نعم | string 1–120 | فريد لكل شركة |
| `slug` | لا | string 1–160 | من `nameAr` إن لم يُرسل |
| `barcode` | لا | string ≤120 \| null | |
| `nameAr` | نعم | string 1–255 | |
| `nameEn` | لا | string ≤255 \| null | |
| `description` | لا | string \| null | |
| `shortDescription` | لا | string \| null | |
| `status` | لا | `ProductStatus` | `draft` |
| `stockStatus` | لا | `StockStatus` | `in_stock` |
| `productType` | لا | `ProductType` | `goods` |
| `tracking` | لا | `ProductTracking` | `none` |
| `invoicePolicy` | لا | `ProductInvoicePolicy` | `ordered` |
| `priceAmount` | لا | number ≥0 | `0` |
| `priceCurrency` | لا | string ≤8 | `SAR` |
| `costPriceAmount` | لا | number ≥0 \| null | |
| `costPriceCurrency` | لا | string ≤8 \| null | |
| `compareAtPriceAmount` | لا | number ≥0 \| null | |
| `compareAtPriceCurrency` | لا | string ≤8 \| null | |
| `trackInventory` | لا | boolean | `true` |
| `lowStockThreshold` | لا | number ≥0 | `5` |
| `allowBackorder` | لا | boolean | `false` |
| `weightKg` | لا | number ≥0 \| null | |
| `lengthCm` | لا | number ≥0 \| null | |
| `widthCm` | لا | number ≥0 \| null | |
| `heightCm` | لا | number ≥0 \| null | |
| `posAvailable` | لا | boolean | `false` |
| `saleOk` | لا | boolean | `true` |
| `purchaseOk` | لا | boolean | `true` |
| `tags` | لا | string[] \| null | فريد |
| `seoMetaTitle` | لا | string ≤255 \| null | |
| `seoMetaDescription` | لا | string \| null | |
| `seoCanonicalPath` | لا | string ≤500 \| null | |
| `seoOgImage` | لا | string \| null | |
| `seoKeywords` | لا | string[] \| null | |
| `createdBy` | لا | string ≤255 \| null | |

> ملاحظة: `quantityCache` يُدار من الـ Backend ولا يُرسل في Create/Update.

### Update Body

كل حقول Create ما عدا `companyId`، مع `updatedBy`. كلها اختيارية.

### Query Filters

`page`, `limit`, `archiveScope`,  
`companyId`, `id`, `brandId`, `categoryId`,  
`sku`, `skuContains`, `slug`, `nameAr`, `nameArContains`, `nameEnContains`, `barcode`,  
`status`, `stockStatus`, `productType`, `tracking`, `invoicePolicy`,  
`trackInventory`, `saleOk`, `purchaseOk`, `posAvailable`, `allowBackorder`,  
`tags` (مفصولة بفاصلة), `search`,  
`priceAmountMin`, `priceAmountMax`

### Response Fields

`id`, `companyId`, `brandId`, `categoryId`, `sku`, `slug`, `barcode`, `nameAr`, `nameEn`, `description`, `shortDescription`, `status`, `stockStatus`, `productType`, `tracking`, `invoicePolicy`,  
`priceAmount` (string), `priceCurrency`,  
`costPriceAmount` (string\|null), `costPriceCurrency`,  
`compareAtPriceAmount` (string\|null), `compareAtPriceCurrency`,  
`trackInventory`, `quantityCache` (string), `lowStockThreshold` (string), `allowBackorder`,  
`weightKg`, `lengthCm`, `widthCm`, `heightCm` (string\|null),  
`posAvailable`, `saleOk`, `purchaseOk`, `tags`,  
`seoMetaTitle`, `seoMetaDescription`, `seoCanonicalPath`, `seoOgImage`, `seoKeywords`,  
`isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 9. Product Media — `/inventory/product-media`

جدول Schema: `product_media`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/product-media` | create |
| GET | `/inventory/product-media` | read |
| GET | `/inventory/product-media/:id` | read |
| PATCH | `/inventory/product-media/:id` | update |
| DELETE | `/inventory/product-media/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `productId` | نعم | uuid | |
| `url` | نعم | string min 1 | |
| `alt` | لا | string ≤255 | افتراضي `''` |
| `type` | لا | `MediaType` | افتراضي `image` |
| `position` | لا | int ≥0 | افتراضي `0` |
| `isPrimary` | لا | boolean | افتراضي `false` |
| `width` | لا | int ≥0 \| null | |
| `height` | لا | int ≥0 \| null | |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

`url`, `alt`, `type`, `position`, `isPrimary`, `width`, `height`, `updatedBy`

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `productId`, `companyId`, `type`, `isPrimary`, `urlContains`, `altContains`, `position`, `search`

### Response Fields

`id`, `productId`, `companyId`, `url`, `alt`, `type`, `position`, `isPrimary`, `width`, `height`, `isArchived`, `archivedAt`, `createdAt`, `createdBy`, `updatedBy`

> لا يوجد `updatedAt` في Response DTO لهذا المورد.

---

## 10. Product UOM Lines — `/inventory/product-uom-lines`

جدول Schema: `product_uom_lines`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/product-uom-lines` | create |
| GET | `/inventory/product-uom-lines` | read |
| GET | `/inventory/product-uom-lines/:id` | read |
| PATCH | `/inventory/product-uom-lines/:id` | update |
| DELETE | `/inventory/product-uom-lines/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `productId` | نعم | uuid | |
| `nameAr` | نعم | string 1–255 | |
| `uneceCode` | لا | string ≤32 \| null | |
| `relativeQuantity` | لا | number ≥0 (حتى 6 منازل) | افتراضي `1` |
| `isReference` | لا | boolean | افتراضي `false` |
| `packagingType` | لا | `PackagingType` | افتراضي `unit` |
| `sortOrder` | لا | int ≥0 | افتراضي `0` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

كل الحقول ما عدا `productId`، مع `updatedBy`.

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `productId`, `companyId`, `nameAr`, `nameArContains`, `uneceCode`, `uneceCodeContains`, `relativeQuantity`, `relativeQuantityMin`, `relativeQuantityMax`, `isReference`, `packagingType`, `sortOrder`, `sortOrderMin`, `sortOrderMax`, `search`

### Response Fields

`id`, `productId`, `companyId`, `nameAr`, `uneceCode`, `relativeQuantity` (string), `isReference`, `packagingType`, `sortOrder`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 11. Product Attribute Lines — `/inventory/product-attribute-lines`

جدول Schema: `product_attribute_lines`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/product-attribute-lines` | create |
| GET | `/inventory/product-attribute-lines` | read |
| GET | `/inventory/product-attribute-lines/:id` | read |
| PATCH | `/inventory/product-attribute-lines/:id` | update |
| DELETE | `/inventory/product-attribute-lines/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `productId` | نعم | uuid | |
| `catalogAttributeId` | لا | uuid \| null | إن وُجد يُنسخ الاسم/العرض/`createVariant` |
| `nameAr` | مشروط | string 1–255 | مطلوب إن لم يُنسخ من الكتالوج |
| `displayType` | لا | `AttributeDisplayType` | افتراضي `select` |
| `createVariant` | لا | `VariantCreationMode` | افتراضي `always` |
| `sortOrder` | لا | int ≥0 | افتراضي `0` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

`catalogAttributeId`, `nameAr`, `displayType`, `createVariant`, `sortOrder`, `updatedBy`

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `productId`, `companyId`, `catalogAttributeId`, `nameAr`, `nameArContains`, `displayType`, `createVariant`, `sortOrder`, `search`

### Response Fields

`id`, `productId`, `companyId`, `catalogAttributeId`, `nameAr`, `displayType`, `createVariant`, `sortOrder`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 12. Product Attribute Values — `/inventory/product-attribute-values`

جدول Schema: `product_attribute_values`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/product-attribute-values` | create |
| GET | `/inventory/product-attribute-values` | read |
| GET | `/inventory/product-attribute-values/:id` | read |
| PATCH | `/inventory/product-attribute-values/:id` | update |
| DELETE | `/inventory/product-attribute-values/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `productAttributeLineId` | نعم | uuid | |
| `catalogAttributeValueId` | لا | uuid \| null | يمكن نسخ الحقول منه |
| `nameAr` | مشروط | string 1–255 | مطلوب إن لم يُنسخ |
| `freeText` | لا | string \| null | |
| `defaultExtraPrice` | لا | number ≥0 \| null | |
| `colorHex` | لا | hex \| null | |
| `imageUrl` | لا | string \| null | |
| `sortOrder` | لا | int ≥0 | افتراضي `0` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

`catalogAttributeValueId`, `nameAr`, `freeText`, `defaultExtraPrice`, `colorHex`, `imageUrl`, `sortOrder`, `updatedBy`

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `productAttributeLineId`, `productId`, `companyId`, `catalogAttributeValueId`, `nameAr`, `nameArContains`, `freeTextContains`, `colorHex`, `imageUrlContains`, `sortOrder`, `defaultExtraPriceMin`, `defaultExtraPriceMax`, `search`

### Response Fields

`id`, `productAttributeLineId`, `productId`, `companyId`, `catalogAttributeValueId`, `nameAr`, `freeText`, `defaultExtraPrice` (string\|null), `colorHex`, `imageUrl`, `sortOrder`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 13. Product Variants — `/inventory/product-variants`

جدول Schema: `product_variants`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/product-variants` | create |
| GET | `/inventory/product-variants` | read |
| GET | `/inventory/product-variants/:id` | read |
| PATCH | `/inventory/product-variants/:id` | update |
| DELETE | `/inventory/product-variants/:id` | delete → 204 (أرشفة + `isActive=false`) |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `productId` | نعم | uuid | |
| `combinationKey` | نعم | string 1–500 | فريد لكل منتج |
| `sku` | نعم | string 1–120 | فريد لكل منتج |
| `nameAr` | نعم | string 1–255 | |
| `barcode` | لا | string ≤120 \| null | |
| `imageUrl` | لا | string \| null | |
| `salePriceAmount` | لا | number ≥0 | افتراضي `0` |
| `salePriceCurrency` | لا | string ≤8 | افتراضي `SAR` |
| `costPriceAmount` | لا | number ≥0 | افتراضي `0` |
| `costPriceCurrency` | لا | string ≤8 | افتراضي `SAR` |
| `stockStatus` | لا | `StockStatus` | افتراضي `in_stock` |
| `isActive` | لا | boolean | افتراضي `true` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

كل الحقول ما عدا `productId`، مع `updatedBy`.

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `productId`, `companyId`, `sku`, `skuContains`, `combinationKey`, `nameArContains`, `barcode`, `stockStatus`, `isActive`, `search`, `salePriceAmountMin`, `salePriceAmountMax`, `costPriceAmountMin`, `costPriceAmountMax`

### Response Fields

`id`, `productId`, `companyId`, `combinationKey`, `sku`, `nameAr`, `barcode`, `imageUrl`,  
`salePriceAmount` (string), `salePriceCurrency`,  
`costPriceAmount` (string), `costPriceCurrency`,  
`quantityCache` (string), `stockStatus`, `isActive`,  
`isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 14. Product Variant Attribute Values — `/inventory/product-variant-attribute-values`

جدول Schema: `product_variant_attribute_values`

| Method | Path | Permission | ملاحظات |
|--------|------|------------|---------|
| POST | `/inventory/product-variant-attribute-values` | create | |
| GET | `/inventory/product-variant-attribute-values` | read | بدون `archiveScope` |
| GET | `/inventory/product-variant-attribute-values/:id` | read | |
| PATCH | `/inventory/product-variant-attribute-values/:id` | update | تسميات/لون فقط |
| DELETE | `/inventory/product-variant-attribute-values/:id` | delete | **حذف صلب** (ليس أرشفة) |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `variantId` | نعم | uuid | |
| `productAttributeValueId` | نعم | uuid | يجب أن يكون لنفس المنتج |
| `attributeNameAr` | لا | string | يُنسخ من السطر إن لم يُرسل |
| `valueNameAr` | لا | string | يُنسخ من القيمة إن لم يُرسل |
| `colorHex` | لا | hex \| null | يُنسخ إن لم يُرسل |

### Update Body

`attributeNameAr`, `valueNameAr`, `colorHex`

### Query Filters

`page`, `limit`, `id`, `variantId`, `productAttributeValueId`, `productId`, `companyId`, `attributeNameArContains`, `valueNameArContains`, `colorHex`, `search`

### Response Fields

`id`, `variantId`, `productAttributeValueId`, `productId`, `companyId`, `attributeNameAr`, `valueNameAr`, `colorHex`

> لا توجد حقول أرشفة/تواريخ تدقيق في هذا المورد.

---

## 15. Warehouses — `/inventory/warehouses`

جدول Schema: `warehouses`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/warehouses` | create |
| GET | `/inventory/warehouses` | read |
| GET | `/inventory/warehouses/:id` | read |
| PATCH | `/inventory/warehouses/:id` | update |
| DELETE | `/inventory/warehouses/:id` | delete → 204 |

> عند الإنشاء: يُنشئ النظام مواقع افتراضية (Customers, Vendors, Production, Inventory adjustment, WH, WH/Stock).  
> `code` فريد لكل شركة.

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `companyId` | نعم | uuid | |
| `branchId` | لا | uuid \| null | يجب أن يكون لنفس الشركة |
| `code` | نعم | string 1–64 | فريد لكل شركة |
| `nameAr` | نعم | string 1–255 | |
| `nameEn` | لا | string ≤255 \| null | |
| `description` | لا | string \| null | |
| `address` | لا | string \| null | |
| `status` | لا | `WarehouseStatus` | افتراضي `active` |
| `incomingSteps` | لا | int 1–3 | افتراضي `1` |
| `outgoingSteps` | لا | int 1–3 | افتراضي `1` |
| `buyToResupply` | لا | boolean | افتراضي `false` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

كل الحقول ما عدا `companyId`، مع `updatedBy`. `branchId: null` يمسح الفرع.

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `companyId`, `branchId`, `code`, `codeContains`, `nameAr`, `nameArContains`, `nameEn`, `nameEnContains`, `descriptionContains`, `addressContains`, `status`, `incomingSteps`, `outgoingSteps`, `buyToResupply`, `search`

### Response Fields

`id`, `companyId`, `branchId`, `code`, `nameAr`, `nameEn`, `description`, `address`, `status`, `incomingSteps`, `outgoingSteps`, `buyToResupply`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 16. Warehouse Locations — `/inventory/warehouse-locations`

جدول Schema: `warehouse_locations`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/warehouse-locations` | create |
| GET | `/inventory/warehouse-locations` | read |
| GET | `/inventory/warehouse-locations/:id` | read |
| PATCH | `/inventory/warehouse-locations/:id` | update |
| DELETE | `/inventory/warehouse-locations/:id` | delete → 204 |

> `companyId` يُؤخذ من المستودع. `code` فريد داخل المستودع.

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `warehouseId` | نعم | uuid | |
| `parentLocationId` | لا | uuid \| null | |
| `code` | نعم | string 1–64 | |
| `nameAr` | نعم | string 1–255 | |
| `nameEn` | لا | string ≤255 \| null | |
| `locationType` | لا | `WarehouseLocationType` | افتراضي `internal` |
| `storageCategory` | لا | string ≤120 \| null | |
| `barcode` | لا | string ≤120 \| null | |
| `replenish` | لا | boolean | افتراضي `false` |
| `cycleCountFrequencyDays` | لا | int ≥0 | افتراضي `0` |
| `lastCountAt` | لا | ISO date-time \| null | |
| `nextCountAt` | لا | ISO date-time \| null | |
| `removalStrategy` | لا | `WarehouseRemovalStrategy` | افتراضي `fifo` |
| `aisle` | لا | string ≤64 \| null | |
| `rack` | لا | string ≤64 \| null | |
| `bin` | لا | string ≤64 \| null | |
| `isActive` | لا | boolean | افتراضي `true` |
| `isSystem` | لا | boolean | افتراضي `false` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

كل الحقول ما عدا `warehouseId`، مع `updatedBy`. `parentLocationId: null` يمسح الأب.

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `companyId`, `warehouseId`, `parentLocationId`, `rootOnly`, `code`, `codeContains`, `nameAr`, `nameArContains`, `nameEn`, `nameEnContains`, `locationType`, `storageCategory`, `storageCategoryContains`, `barcode`, `barcodeContains`, `replenish`, `cycleCountFrequencyDays`, `removalStrategy`, `aisle`, `rack`, `bin`, `isActive`, `isSystem`, `search`

### Response Fields

`id`, `companyId`, `warehouseId`, `parentLocationId`, `code`, `nameAr`, `nameEn`, `locationType`, `storageCategory`, `barcode`, `replenish`, `cycleCountFrequencyDays`, `lastCountAt`, `nextCountAt`, `removalStrategy`, `aisle`, `rack`, `bin`, `isActive`, `isSystem`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 17. Warehouse Operations — `/inventory/warehouse-operations`

جدول Schema: `warehouse_operations`

| Method | Path | Permission | ملاحظات |
|--------|------|------------|---------|
| POST | `/inventory/warehouse-operations` | create | `reference` فريد لكل شركة؛ يُولَّد تلقائياً إن لم يُرسل (`op-<n>`) |
| GET | `/inventory/warehouse-operations` | read | |
| GET | `/inventory/warehouse-operations/:id` | read | |
| PATCH | `/inventory/warehouse-operations/:id` | update | **مرفوض** إذا الحالة `done` أو `cancelled` |
| DELETE | `/inventory/warehouse-operations/:id` | delete → 204 | |

> CRUD وحده لا يرحّل المخزون؛ الترحيل يتم عبر إنشاء قيود في الـ Ledger.

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `companyId` | نعم | uuid | |
| `warehouseId` | نعم | uuid | |
| `destinationWarehouseId` | لا | uuid \| null | للتحويلات |
| `kind` | نعم | `WarehouseOperationKind` | |
| `reference` | لا | string 1–64 \| null | تلقائي إن لم يُرسل |
| `status` | لا | `WarehouseOperationStatus` | افتراضي `draft` |
| `occurredAt` | لا | ISO date-time | افتراضي الآن |
| `notes` | لا | string \| null | |
| `partnerName` | لا | string ≤255 \| null | |
| `sourceDocument` | لا | string ≤255 \| null | |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

`destinationWarehouseId`, `kind`, `reference`, `status`, `occurredAt`, `notes`, `partnerName`, `sourceDocument`, `updatedBy`  
(لا يمكن تغيير `companyId` / `warehouseId`)

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `companyId`, `warehouseId`, `destinationWarehouseId`, `kind`, `status`, `reference`, `referenceContains`, `partnerNameContains`, `sourceDocumentContains`, `notesContains`, `occurredAtFrom`, `occurredAtTo`, `search`

### Response Fields

`id`, `companyId`, `warehouseId`, `destinationWarehouseId`, `kind`, `reference`, `codeNumber` (number), `status`, `occurredAt`, `notes`, `partnerName`, `sourceDocument`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 18. Warehouse Operation Lines — `/inventory/warehouse-operation-lines`

جدول Schema: `warehouse_operation_lines`

| Method | Path | Permission | ملاحظات |
|--------|------|------------|---------|
| POST | `/inventory/warehouse-operation-lines` | create | مرفوض إذا العملية الأب `done`/`cancelled` |
| GET | `/inventory/warehouse-operation-lines` | read | |
| GET | `/inventory/warehouse-operation-lines/:id` | read | |
| PATCH | `/inventory/warehouse-operation-lines/:id` | update | |
| DELETE | `/inventory/warehouse-operation-lines/:id` | delete → 204 | |

### سياسة المخزون: منتج أساسي vs متغيرات (تجديد المخزون)

الـ API الحالي كافٍ عبر `productId` + `variantId`. السياسة المطبّقة على الـ Backend (**مرنة + منع المزج**):

| الوضع | `variantId` | متى |
|--------|-------------|-----|
| منتج أساسي فقط | `null` | مسموح حتى لو للمنتج متغيرات نشطة |
| حسب المتغيرات | uuid لمتغير | المتغير نشط ويتبع نفس `productId` |
| مزج الاثنين لنفس المنتج في نفس العملية | — | **مرفوض** `400` |

قواعد التحقق:

1. إن وُجد `variantId` → يجب أن يكون لنفس `productId`، نشطًا وغير مؤرشف.
2. إن وُجد `variantId` والمنتج بلا متغيرات نشطة → رفض.
3. كل الأسطر النشطة لنفس `productId` داخل نفس `operationId` يجب أن تكون إما كلها `variantId: null` أو كلها بـ `variantId`.
4. عند إنشاء قيد Ledger: `variantId` يجب أن يطابق سطر العملية (أو يُحذف من الـ body ليُورَث من السطر).

رسالة الخطأ عند المزج:

```json
{
  "message": "Product has variants; each line must include variantId (or use product-only mode with no variants on any line)"
}
```

**ما يفعله الـ Frontend:** في حوار تجديد المخزون اعرض اختيارًا — «المنتج الأساسي فقط» أو «حسب المتغيرات» — وابنِ الأسطر وفق الوضع دون مزج في نفس العملية.

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `operationId` | نعم | uuid | |
| `productId` | نعم | uuid | |
| `variantId` | لا | uuid \| null | |
| `productName` | لا | string | من المنتج/المتغير إن لم يُرسل |
| `sku` | لا | string ≤120 \| null | |
| `demandQuantity` | لا | number ≥0 | افتراضي `0` |
| `quantity` | لا | number ≥0 | افتراضي `0` |
| `fromLocationId` | لا | uuid \| null | |
| `toLocationId` | لا | uuid \| null | |
| `notes` | لا | string \| null | |
| `sortOrder` | لا | int ≥0 | افتراضي `0` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

كل الحقول ما عدا `operationId`، مع `updatedBy`.

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `operationId`, `companyId`, `productId`, `variantId`, `fromLocationId`, `toLocationId`, `productNameContains`, `sku`, `skuContains`, `sortOrder`, `search`

### Response Fields

`id`, `operationId`, `companyId`, `productId`, `variantId`, `productName`, `sku`, `demandQuantity` (string), `quantity` (string), `fromLocationId`, `toLocationId`, `notes`, `sortOrder`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 19. Inventory Ledger — `/inventory/ledger-entries`

جدول Schema: `inventory_ledger_entries` (سجل غير قابل للتعديل)

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/ledger-entries` | create |
| GET | `/inventory/ledger-entries` | read |
| GET | `/inventory/ledger-entries/:id` | read |

> لا يوجد PATCH ولا DELETE.

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `companyId` | نعم | uuid | |
| `operationId` | نعم | uuid | |
| `operationLineId` | نعم | uuid | |
| `locationId` | نعم | uuid | |
| `quantityDelta` | نعم | number موقّع | `+` دخول / `-` خروج |
| `occurredAt` | لا | ISO date-time | من العملية إن لم يُرسل |
| `operationReference` | لا | string | من العملية |
| `kind` | لا | `WarehouseOperationKind` | من العملية |
| `productId` | لا | uuid | من السطر |
| `productName` | لا | string | من السطر |
| `variantId` | لا | uuid \| null | |
| `sku` | لا | string ≤120 \| null | |
| `warehouseId` | لا | uuid | من الموقع/العملية |
| `counterpartLocationId` | لا | uuid \| null | |
| `counterpartWarehouseId` | لا | uuid \| null | |
| `sourceDocument` | لا | string ≤255 \| null | |
| `partnerName` | لا | string ≤255 \| null | |
| `notes` | لا | string \| null | |

### Query Filters

`page`, `limit` (بدون `archiveScope`)،  
`id`, `companyId`, `operationId`, `operationLineId`, `productId`, `variantId`, `warehouseId`, `locationId`, `kind`,  
`operationReference`, `operationReferenceContains`, `productNameContains`, `sku`, `skuContains`,  
`occurredAtFrom`, `occurredAtTo`, `search`

### Response Fields

`id`, `companyId`, `occurredAt`, `operationId`, `operationLineId`, `operationReference`, `kind`, `productId`, `productName`, `variantId`, `sku`, `warehouseId`, `locationId`, `quantityDelta` (string موقّع), `counterpartLocationId`, `counterpartWarehouseId`, `sourceDocument`, `partnerName`, `notes`, `createdAt`

---

## 20. Putaway Rules — `/inventory/putaway-rules`

جدول Schema: `putaway_rules`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/inventory/putaway-rules` | create |
| GET | `/inventory/putaway-rules` | read |
| GET | `/inventory/putaway-rules/:id` | read |
| PATCH | `/inventory/putaway-rules/:id` | update |
| DELETE | `/inventory/putaway-rules/:id` | delete → 204 |

> قواعد الخدمة: إذا `appliesTo=product` → `productId` مطلوب؛ إذا `appliesTo=category` → `categoryId` مطلوب.

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `companyId` | نعم | uuid | |
| `warehouseId` | نعم | uuid | |
| `arriveLocationId` | نعم | uuid | |
| `appliesTo` | لا | `PutawayAppliesTo` | افتراضي `all` |
| `productId` | مشروط | uuid \| null | مطلوب عند `product` |
| `categoryId` | مشروط | uuid \| null | مطلوب عند `category` |
| `packagingType` | لا | `PackagingType` \| null | |
| `storeLocationId` | نعم | uuid | |
| `subLocationId` | لا | uuid \| null | |
| `sequence` | لا | int ≥0 | افتراضي `10` |
| `isActive` | لا | boolean | افتراضي `true` |
| `createdBy` | لا | string ≤255 \| null | |

### Update Body

`arriveLocationId`, `appliesTo`, `productId`, `categoryId`, `packagingType`, `storeLocationId`, `subLocationId`, `sequence`, `isActive`, `updatedBy`  
(لا تغيير لـ `companyId` / `warehouseId`)

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `companyId`, `warehouseId`, `arriveLocationId`, `storeLocationId`, `subLocationId`, `productId`, `categoryId`, `appliesTo`, `packagingType`, `sequence`, `isActive`

### Response Fields

`id`, `companyId`, `warehouseId`, `arriveLocationId`, `appliesTo`, `productId`, `categoryId`, `packagingType`, `storeLocationId`, `subLocationId`, `sequence`, `isActive`, `isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

---

## 21. تسلسل بناء مقترح للـ Frontend (متوافق مع Schema)

ترتيب منطقي لإنشاء الشاشات والربط:

```text
1) Categories
2) Catalog Attributes → Catalog Attribute Values
3) Products
4) Product Media / Product UOM Lines
5) Product Attribute Lines → Product Attribute Values
6) Product Variants → Product Variant Attribute Values
7) Warehouses → Warehouse Locations (تلقائية عند إنشاء المستودع)
8) Putaway Rules
9) Warehouse Operations → Operation Lines
10) Ledger Entries (ترحيل المخزون)
```

### علاقات مهمة للـ UI

```text
Company
 └─ Category (parentId اختياري)
 └─ CatalogAttribute
 │    └─ CatalogAttributeValue
 └─ Product (brandId, categoryId)
 │    ├─ ProductMedia
 │    ├─ ProductUomLine
 │    ├─ ProductAttributeLine → ProductAttributeValue
 │    └─ ProductVariant → ProductVariantAttributeValue
 └─ Warehouse (branchId اختياري)
      ├─ WarehouseLocation (parentLocationId اختياري)
      ├─ PutawayRule
      └─ WarehouseOperation
           ├─ WarehouseOperationLine
           └─ InventoryLedgerEntry
```

---

## 22. أمثلة سريعة

### إنشاء منتج

```http
POST /inventory/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": "11111111-1111-4111-8111-111111111111",
  "sku": "SKU-001",
  "nameAr": "منتج تجريبي",
  "status": "draft",
  "productType": "goods",
  "priceAmount": 100,
  "priceCurrency": "SAR"
}
```

### قائمة منتجات مع فلاتر

```http
GET /inventory/products?companyId=<uuid>&status=active&page=1&limit=20&archiveScope=active&search=هاتف
Authorization: Bearer <token>
```

### إنشاء عملية استلام ثم سطر ثم قيد Ledger

```http
POST /inventory/warehouse-operations
{ "companyId": "...", "warehouseId": "...", "kind": "receipt", "status": "draft" }

POST /inventory/warehouse-operation-lines
{ "operationId": "...", "productId": "...", "quantity": 10, "toLocationId": "..." }

POST /inventory/ledger-entries
{ "companyId": "...", "operationId": "...", "operationLineId": "...", "locationId": "...", "quantityDelta": 10 }
```

---

## 23. ملخص الأعداد

| المجموعة | المسار | عدد الـ Endpoints |
|----------|--------|-------------------|
| Categories | `/inventory/categories` | 5 |
| Catalog Attributes | `/inventory/catalog-attributes` | 5 |
| Catalog Attribute Values | `/inventory/catalog-attribute-values` | 5 |
| Products | `/inventory/products` | 5 |
| Product Media | `/inventory/product-media` | 5 |
| Product UOM Lines | `/inventory/product-uom-lines` | 5 |
| Product Attribute Lines | `/inventory/product-attribute-lines` | 5 |
| Product Attribute Values | `/inventory/product-attribute-values` | 5 |
| Product Variants | `/inventory/product-variants` | 5 |
| Variant Attribute Values | `/inventory/product-variant-attribute-values` | 5 |
| Warehouses | `/inventory/warehouses` | 5 |
| Warehouse Locations | `/inventory/warehouse-locations` | 5 |
| Warehouse Operations | `/inventory/warehouse-operations` | 5 |
| Operation Lines | `/inventory/warehouse-operation-lines` | 5 |
| Ledger | `/inventory/ledger-entries` | 3 |
| Putaway Rules | `/inventory/putaway-rules` | 5 |
| **الإجمالي** | | **78** |

---

*آخر تحديث مبني على موديول `src/modules/inventory` ومتوافق مع `inventory-database-schema.md`.*
