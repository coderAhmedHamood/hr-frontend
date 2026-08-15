# Store — ملف ربط الفرونت (Endpoints + أشكال البيانات)

> مرجع ربط الفرونت للمتجر الإلكتروني: **الرابط · Auth · Query/Body · شكل `data`**.  
> الجداول (`store_*` + Inventory/Partners) متوفرة في الهجرة `1783373644646-store-ecommerce`.  
> هذا الملف عقد الربط للفرونت.

**Base:** `{HOST}` · **JSON:** camelCase · Swagger: `http://localhost:3000/docs`

---

## 0) حالة الجداول (Blueprint ↔ Backend)

| جدول / مصدر في الـ Blueprint | الحالة |
|------------------------------|--------|
| `store_company_settings` | ✅ |
| `store_checkout_cities` | ✅ |
| `store_social_links` | ✅ |
| `store_nav_items` | ✅ |
| `store_footer_link_groups` / `store_footer_links` | ✅ |
| `store_announcement_items` | ✅ |
| `store_content_about` (+ sections / stats) | ✅ |
| `store_content_contact` | ✅ |
| `store_contact_messages` | ✅ |
| `store_faq_items` | ✅ |
| `store_legal_pages` | ✅ |
| `store_cms_pages` / `store_cms_sections` | ✅ (homepage) |
| `store_orders` / `store_order_lines` | ✅ |
| `store_order_status_history` | ✅ |
| `store_order_line_allocations` | ✅ |
| `inventory_products.rating_avg` / `review_count` | ✅ |
| `inventory_products` / `categories` / `brands` | ✅ مسبقاً |
| `inventory_product_favorites` (wishlist) | ✅ مسبقاً |
| `inventory_product_reviews` | ✅ مسبقاً |
| `partners` + Partner Auth | ✅ مسبقاً |
| سلة خادمية / كوبونات / مدونة | ❌ خارج النطاق |

---

## 1) شكل الاستجابة الموحّد (مثل الموارد البشرية)

### Envelope (كل الردود عدا `204`)

```json
{
  "status": 200,
  "message": "Success",
  "data": { },
  "error": null
}
```

الحقول أدناه = محتوى **`data` فقط**.

### قائمة الجلب (List) — نفس HR

```json
{
  "items": [ ],
  "pagination": {
    "page": 1,
    "limit": 200,
    "total": 523,
    "totalPages": 3
  }
}
```

**Query افتراضي للقوائم:** `page=1` · `limit=200`

### ما ليس قائمة

كائن واحد (إعدادات، منتج، طلب، صفحة، config، about…) يبقى كائناً مباشراً داخل `data` — **بدون** لفّه في `items`.

### المبالغ

string عشري، مثال: `"12.5000"`.

---

## 2) كتالوج عام — Inventory

### `GET /public/inventory/products`

- **Auth:** لا
- **Query:** `companyId*` · `id?` · `brandId?` · `categoryId?` · `slug?` · `search?` · `isNewProduct?` · `isTodayDeal?` · `isWholesale?` · `isDiscounted?` · `tags?` · `sort?` · `sortDirection?` · `page?` · `limit?`
- **`data`:**

```ts
{
  items: PublicProduct[],
  pagination: { page, limit, total, totalPages }
}
```

**حقول عنصر المنتج (مختصر للبطاقة + كامل للقائمة):**  
`id`, `companyId`, `brandId`, `categoryId`, `sku`, `slug`, `barcode`, `nameAr`, `nameEn`, `description`, `shortDescription`, `status`, `stockStatus`, `productType`, `tracking`, `invoicePolicy`, `priceAmount`, `priceCurrency`, `costPriceAmount`, `costPriceCurrency`, `compareAtPriceAmount`, `compareAtPriceCurrency`, `trackInventory`, `quantityCache` (**إجمالي on-hand الحي = Σ قيود الدفتر للمنتج بكل متغيراته**), `lowStockThreshold`, `allowBackorder`, أبعاد، أعلام عروض (`isNewProductActive`, `isTodayDealActive`, …)، `tags`, SEO، `primaryImageUrl`, `primaryImageAlt`, `createdAt`, `updatedAt`, …

### `GET /public/inventory/products/by-slug/:slug?companyId=`

- **`data`:** منتج واحد (نفس الحقول)

### `GET /public/inventory/products/:productId/stock?companyId=`

- **Auth:** لا
- **الغرض:** كمية موثوقة للعرض (لا تعتمد على `quantityCache` في رأس المنتج)
- **مصدر الحقيقة:** `SUM(ledger.quantity_delta)`
- **`data`:**

```ts
{
  productId, companyId, trackInventory,
  onHand,      // إجمالي كل القيود للمنتج
  reserved,    // حالياً دائماً "0.0000"
  available,   // onHand - reserved  ← استخدم هذا لصنف بلا متغيرات
  productLevelOnHand, // قيود بدون variantId
  quantityCache,      // كاش قديم — للمقارنة فقط
  displayLevel: "product" | "variant",
  variants: [{
    variantId, sku, nameAr,
    onHand, reserved, available,  // ← استخدم available + variantId عند وجود متغيرات
    quantityCache, isActive
  }]
}
```

- إن `displayLevel === "variant"` → اعرض كمية كل متغير من `variants[]`
- إن `displayLevel === "product"` → اعرض `available` على مستوى المنتج
- لوحة الموظفين (نفس الشكل): `GET /inventory/products/:id/stock`

### `GET /public/inventory/categories` · `.../by-slug/:slug`

- قائمة: `{ items, pagination }` · تفصيل: كائن واحد  
- حقول التصنيف: `id`, `companyId`, `parentId`, `slug`, `nameAr`, `nameEn`, `description`, `imageUrl`, `imageAlt`, `featuredBrandIds`, SEO، `displayOrder`, `isActive`, …

### `GET /public/inventory/brands` · `.../by-slug/:slug`

- قائمة: `{ items, pagination }` · تفصيل: كائن واحد  
- حقول: `id`, `companyId`, `slug`, `nameAr`, `nameEn`, `description`, `logoUrl`, `logoAlt`, `websiteUrl`, SEO، `displayOrder`, `isActive`, …

---

## 3) إعدادات ومحتوى عام — Public Store

### `GET /public/store/companies/:companyId/config`

- **Auth:** لا  
- **`data`:** كائن مجمع (ليس قائمة):

```ts
{
  settings: StoreSettings,          // انظر § إعدادات
  checkoutCities: City[],           // مصفوفة كاملة داخل الـ bootstrap
  socialLinks: Social[],            // المفعّلة فقط
  primaryNav: NavItem[],
  secondaryNav: NavItem[],
  footerLinkGroups: FooterGroup[],
  announcements: Announcement[]     // المفعّلة فقط — شريط الإعلانات
}
```

> البنرات / Hero: ليست هنا — من `pages/homepage` أقسام `hero-carousel` / `banner`.

### `GET /public/store/pages/homepage?companyId=`

```ts
{
  id, companyId, pageType, status, slug,
  titleAr, titleEn, revision, publishedAt,
  sections: [{
    id, sectionType, status, enabled, sortOrder, revision,
    content, settings, style, dataSourceKind, dataSource,
    publishedAt, updatedAt
  }],
  createdAt, updatedAt
}
```

`sectionType`: `hero-carousel` | `category-grid` | `product-carousel` | `flash-sale` | `features-grid` | `brand-slider` | `banner`

### `GET /public/store/content/about?companyId=`

```ts
{
  companyId, headlineAr, headlineEn, introAr, introEn,
  sections: [{ id, titleAr, titleEn, bodyAr, bodyEn, sortOrder }],
  stats: [{ id, labelAr, labelEn, value, sortOrder }],
  updatedAt
}
```

### `GET /public/store/content/contact?companyId=`

```ts
{ companyId, headlineAr, headlineEn, introAr, introEn, hoursAr, hoursEn, mapEmbedUrl, updatedAt }
```

### `GET /public/store/content/faq?companyId=&page=&limit=`

```ts
{
  items: [{
    id, companyId, questionAr, questionEn, answerAr, answerEn,
    sortOrder, isPublished, createdAt, updatedAt
  }],
  pagination: { page, limit, total, totalPages }
}
```

### `GET /public/store/content/legal/:slug?companyId=`

- `slug`: `privacy` | `terms` | `returns`  
- **`data`:** `{ id, companyId, slug, titleAr, titleEn, bodyAr, bodyEn, seoMetaTitleAr, seoMetaTitleEn, seoMetaDescriptionAr, seoMetaDescriptionEn, updatedAt }`

### `GET /public/store/products/:productId/reviews?companyId=&page=&limit=`

```ts
{
  items: [{
    id, productId, companyId, partnerId, rating, title, body, status,
    guestName, guestEmail, guestPhone, isArchived, archivedAt,
    createdAt, updatedAt, createdBy, updatedBy
  }],
  pagination: { page, limit, total, totalPages }
}
```

### `GET /public/store/search?companyId=&q=&page=&limit=`

```ts
{
  query: string,
  products: {
    items: [{ id, slug, nameAr, nameEn, priceAmount, priceCurrency, primaryImageUrl }],
    pagination: { page, limit, total, totalPages }
  },
  categories: {
    items: [{ id, slug, nameAr, nameEn, imageUrl }],
    pagination: { page, limit, total, totalPages }
  },
  brands: {
    items: [{ id, slug, nameAr, nameEn, logoUrl }],
    pagination: { page, limit, total, totalPages }
  }
}
```

> المنتجات ترقّم بـ `page`/`limit` من الـ query. التصنيفات/العلامات مقصوصة (حد أعلى) لكن بنفس شكل HR.

### `POST /public/store/contact-messages` → 201

**Body:** `{ companyId, name, email?, phone?, message }`  
**`data`:** `{ id, companyId, name, email, phone, message, createdAt }`

### `POST /public/store/orders` → 201

**Header اختياري:** `Idempotency-Key`  
**Body:**

```ts
{
  companyId, paymentMethod, paymentProofUrl?, locale?,
  address: { fullName, phone, city, district, street, notes?, lat?, lng?, mapAddress? },
  items: [{ productId, variantId?, quantity }]
}
```

**خصم المخزون:** **ليس تلقائياً** عند إنشاء الطلب.  
الفرونت/الأدمن يستدعي يدوياً: `POST /inventory/stock/sale-deduct` مع `sourceDocument = orderNumber`.

**إرجاع المخزون عند الإلغاء/الاسترداد:** تلقائي عند `cancelled` / `refunded` (لما سبق خصمه يدوياً بنفس `sourceDocument`)  
دليل الفرونت الكامل (خصم + تراجع): [`store-sale-stock-frontend.md`](./store-sale-stock-frontend.md)  
POS + مستودع المنتج + اختيار Location: [`inventory-pos-stock-frontend.md`](./inventory-pos-stock-frontend.md)

**API موظف:**  
- خصم: `POST /inventory/stock/sale-deduct`  
- إرجاع: `POST /inventory/stock/sale-restore`  
- قائمة سريعة: `GET /inventory/stock`  
Body الخصم: `{ companyId, locationId?, warehouseId?, sourceDocument?, lines: [{ productId, variantId?, quantity, locationId? }] }`  
`locationId` اختياري — إن حُذف يُخصم من مستودع/موقع المنتج.

**`data`:** طلب كامل — انظر § شكل الطلب

### `GET /public/store/orders` — Bearer `typ=partner`

قائمة طلبات العميل المسجّل (من التوكن فقط).

**Query:** `page?`, `limit?`, `status?`

**`data`:** `{ items: StoreOrder[], pagination }` — كل عنصر طلب كامل مثل تتبع الطلب.

### `GET /public/store/orders/:orderNumber?companyId=&phone=`

- ضيف: `phone` إلزامي · شريك: توكن بدل الهاتف  
- **`data`:** طلب كامل

---

## 3) المفضلة — Partner JWT / أيقونات الهيدر

### `GET /public/store/badges` — أعداد أيقونات السلة والمفضلة

- **Auth:** اختياري — إن وُجد `Bearer` شريك (`typ=partner`) يُحسب عدد المفضلة؛ وإلا `wishlistCount = 0`
- **الغرض:** دالة واحدة خفيفة لأيقونات الهيدر (بدون جلب القوائم)

**`data`:**
```json
{
  "wishlistCount": 3,
  "cartCount": null
}
```

| الحقل | المعنى |
|--------|--------|
| `wishlistCount` | عدد منتجات المفضلة للعميل المسجّل |
| `cartCount` | دائماً `null` — السلة محلية في الفرونت؛ استخدم `cart.items.length` من localStorage |

**مثال فرونت:**
```ts
const { wishlistCount } = data;
const cartCount = localCartItems.length; // أو مجموع الكميات
```

### `GET /public/store/wishlist?page=&limit=`

```ts
{
  items: [{
    id, productId, productSlug, productNameAr, productNameEn,
    priceAmount, priceCurrency, primaryImageUrl, createdAt
  }],
  pagination: { page, limit, total, totalPages }
}
```

### `POST /public/store/wishlist` → 201

**Body:** `{ productId }`  
**`data`:** نفس شكل القائمة أعلاه بعد الإضافة

### `DELETE /public/store/wishlist/:productId` → **204** (بدون body)

---

## 5) مصادقة العميل — Partner Auth

### `POST /public/partners/auth/register` → 201

**Body:** `{ companyId, name, email, mobile, password, accountKind?, branchId? }`

### `POST /public/partners/auth/login`

**Body:** `{ identifier, password, companyId? }`

**`data` (register/login):**

```ts
{
  access_token: string,
  userId, partnerId, companyId,
  user: { id, email, phone, fullNameAr, userType },
  partner: { id, companyId, name, displayName, isCustomer, isVendor, email, mobile, accountKind? },
  message?: string | null
}
```

### `GET /public/partners/auth/me`

```ts
{
  userId, partnerId, companyId, email, phone, fullNameAr, userType,
  partnerName, displayName, partnerStatus, isCustomer, isVendor,
  partnerEmail, partnerMobile
}
```

### `PATCH /public/partners/auth/profile` — Bearer `typ=partner`

**Body:** `{ name, email, mobile }`

يحدّث `users` + `partners` + قنوات الإيميل/الجوال الأساسية، ويعيد نفس شكل `data` لـ login/register (مع `access_token` جديد).

### `POST /public/partners/auth/logout`

**`data`:** `{ success: true, message }`

---

## 6) رفع الملفات

### `GET /uploads/categories` — موظف + `system.uploads.create`

**`data`:** مصفوفة `{ category, label, description, storagePath, uploadPath, mimeTypes, maxSizeBytes, maxSizeMb }`

### `POST /uploads/:category` — multipart `file`

**`data`:** `{ category, fileName, originalName, path, url, absolutePath, mimeType, size }`

---

## 7) إدارة — Settings (`sta.settings.*`)

Base: `/store-admin/companies/:companyId`

### `GET|PATCH .../settings`

**`data` — StoreSettings:**

```ts
{
  companyId, storeNameAr, storeNameEn, logoUrl, faviconUrl,
  themePrimary, themeSecondary, themeAccent,
  contactPhone, contactEmail, contactAddress,
  seoHomeTitleAr, seoHomeTitleEn, seoHomeDescriptionAr, seoHomeDescriptionEn,
  seoProductsTitleAr, seoProductsTitleEn, seoProductsDescriptionAr, seoProductsDescriptionEn,
  seoKeywords, seoDefaultOgImage,
  footerCopyrightOwnerAr, footerCopyrightOwnerEn, footerCommercialRegistration,
  announcementEnabled, announcementDismissible, announcementScrolling, announcementSpeedMs,
  checkoutDefaultCity, checkoutFreeShippingThreshold, checkoutStandardShippingFee,
  checkoutPaymentMethods, storePageOffersEnabled, storePageWholesaleEnabled,
  defaultLocale, currencyCode, timezone, createdAt, updatedAt
}
```

### قوائم الأبناء (GET و PUT بعد الحفظ) — شكل HR

| Method | Path | عنصر `items[]` |
|--------|------|----------------|
| GET/PUT | `.../settings/checkout-cities` | `{ id, name, sortOrder }` |
| GET/PUT | `.../settings/social-links` | `{ network, url, enabled }` |
| GET/PUT | `.../settings/nav-items` | `{ id, kind, labelAr, labelEn, href, highlight, sortOrder }` |
| GET/PUT | `.../settings/footer` | `{ id, titleAr, titleEn, sortOrder, links: [{ id, labelAr, labelEn, href, sortOrder }] }` |
| GET/PUT | `.../settings/announcements` | `{ id, enabled, messageAr, messageEn, href, sortOrder }` |

**شكل الـ `data` دائماً:**

```ts
{ items: T[], pagination: { page, limit, total, totalPages } }
```

**PUT bodies:** استبدال كامل — `cities` / `socialLinks` / `navItems` / `groups` / `announcements` (انظر Swagger).

---

## 8) إدارة — Content (`sta.content.*`)

| Method | Path | `data` |
|--------|------|--------|
| GET/PUT | `.../content/about` | كائن About |
| GET/PUT | `.../content/contact` | كائن Contact |
| GET | `.../contact-messages?page=&limit=` | `{ items, pagination }` رسائل |
| GET | `.../faq?page=&limit=` | `{ items, pagination }` FAQ |
| POST | `.../faq` | عنصر FAQ واحد |
| PATCH | `.../faq/:id` | عنصر FAQ واحد |
| DELETE | `.../faq/:id` | 204 |
| GET/PUT | `.../legal/:slug` | صفحة قانونية |

---

## 9) إدارة — Pages (`sta.pages.*`)

| Method | Path | `data` |
|--------|------|--------|
| GET | `.../pages/homepage` | صفحة + كل الأقسام |
| PUT | `.../pages/homepage` | بعد الحفظ — نفس الشكل |

**PUT body:** `{ status?, titleAr?, titleEn?, sections: [{ sectionType, status?, enabled?, sortOrder?, content?, settings?, style?, dataSourceKind?, dataSource? }] }`

---

## 10) إدارة — Orders (`sta.orders.*`)

### `GET /store-admin/orders?companyId=&status=&paymentStatus=&paymentMethod=&partnerId=&city=&search=&page=&limit=`

```ts
{
  items: [{
    id, orderNumber, customerNameAr, phone, status,
    paymentMethod, paymentStatus, shipCity, currencyCode,
    totalAmount, lineCount, createdAt
  }],
  pagination: { page, limit, total, totalPages }
}
```

### `GET /store-admin/orders/:id` · mutations → شكل الطلب الكامل

| Method | Path | Body |
|--------|------|------|
| PATCH | `.../:id/status` | `{ status, note? }` |
| PATCH | `.../:id/payment` | `{ paymentStatus, paymentProofUrl? }` |
| POST | `.../:id/lines/:lineId/allocations` | `{ warehouseId, locationId, quantity }` |
| DELETE | `.../allocations/:allocationId` | — |
| PATCH | `.../lines/:lineId/ship-status` | `{ shipStatus }` |

---

## 11) شكل الطلب الكامل (Order)

```ts
{
  id, companyId, orderNumber, partnerId, customerNameAr, phone,
  status, paymentMethod, paymentStatus, paymentProofUrl, source, locale,
  shipFullName, shipPhone, shipCity, shipDistrict, shipStreet,
  shipNotes, shipLat, shipLng, shipMapAddress,
  currencyCode, subtotalAmount, shippingFeeAmount, totalAmount,
  estimatedDeliveryAt,
  lines: [{
    id, productId, variantId, productName, productSlug, imageUrl,
    quantity, unitPriceAmount, unitPriceCurrency, lineTotalAmount,
    shipStatus, sortOrder,
    allocations: [{ id, warehouseId, locationId, quantity }]
  }],
  statusHistory: [{ id, fromStatus, toStatus, changedBy, note, createdAt }],
  createdAt, updatedAt
}
```

**Enums:**  
`status`: pending|confirmed|processing|shipped|delivered|cancelled|refunded  
`paymentMethod`: cash_on_delivery|card  
`paymentStatus`: pending|paid|failed|refunded  
`shipStatus`: unassigned|assigned|partial|shipped

---

## 12) قواعد فرونت سريعة

1. كل **قائمة جلب** → اقرأ `data.items` و `data.pagination` (مثل HR).  
2. `config` و `homepage` و detail endpoints → كائن مباشر في `data`.  
3. البحث: `data.products.items` + `data.products.pagination` (ونفس الفكرة لـ categories/brands).  
4. السلة محلية؛ لا endpoint سلة.  
5. شريط الإعلانات من `config.announcements`؛ البنرات من أقسام homepage.  
6. بعد حفظ إدارة المحتوى/الإعدادات/الهوم يُبطَل كاش القراءة العامة تلقائياً.

---

*آخر تحديث: 2026-08-02 — جداول Blueprint متوفرة · قوائم الجلب موحّدة مع HR `{ items, pagination }`.*
