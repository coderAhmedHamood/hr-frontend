# وثيقة مخطط قاعدة البيانات وواجهة Backend — متجر إلكتروني (Ecommerce Store)

> **مصدر الحقيقة:** تحليل كود Frontend فقط في المستودع الحالي (`src/features/ecommerce/**`, `src/app/[locale]/store/**`, `src/app/(app)/(ecommerce)/**`).  
> **لا ميزات مخمّنة.** كل ما لم يُنفَّذ في الواجهة مذكور صراحة تحت «خارج النطاق».  
> **وثائق مرتبطة موجودة مسبقاً (لا تُعاد اختراعها):**
>
> - [`inventory-database-schema.md`](./inventory-database-schema.md) — منتجات، تصنيفات، علامات، سمات، مخزون  
> - [`contacts-partners-design.md`](./contacts-partners-design.md) / [`contacts-database-schema.md`](./contacts-database-schema.md) — شركاء/عملاء  
> - [`section-definition-backend-contract.md`](../src/features/ecommerce/storefront/page-builder/docs/section-definition-backend-contract.md) — عقود أقسام الصفحة الرئيسية  

**تاريخ التحليل:** 2026-08-02  
**محرك SQL المقترح:** PostgreSQL 15+  
**مفاتيح:** UUID · **أعمدة:** snake_case · **JSON API:** camelCase · **تعدد الشركات:** `company_id` إلزامي  

---

## 0. منهجية التحليل وحدود الوثيقة

### 0.1 ما تم فحصه

| منطقة | مسارات |
|--------|--------|
| متجر عام | `src/app/[locale]/store/**` |
| نماذج المتجر | `src/features/ecommerce/storefront/domain/**` |
| منشئ الصفحات | `src/features/ecommerce/storefront/page-builder/**` |
| لوحة إدارة المتجر | `src/app/(app)/(ecommerce)/**`, `src/features/ecommerce/admin/**` |
| نطاق الكتالوج/الطلبات | `src/features/ecommerce/domain/**` |
| مocks ومستودعات | `shared/lib/mock/**`, `storefront/lib/mock/**`, `lib/repositories/**` |

### 0.2 خارج النطاق — مذكور في قوائم المتطلبات العامة لكن **غير موجود** في Frontend الحالي

لا تُنشأ جداول/واجهات لهذه العناصر في المرحلة الحالية:

| عنصر | الحالة في الكود |
|------|------------------|
| Blog / مقالات | مجلدات فارغة بدون `page.tsx` |
| Compare (مقارنة منتجات) | غير موجود (يوجد فقط `compareAtPrice` للسعر) |
| Coupon / Voucher / Gift Card | غير موجود |
| Tax محرك ضريبي منفصل | غير موجود (الشحن فقط من إعدادات الشركة) |
| Address Book منفصل | غير موجود (عنوان الطلب داخل الطلب) |
| OTP / تفعيل حساب بالبريد | غير موجود |
| Password Reset للعملاء | صفحة stub «قريباً» فقط — بلا API |
| Notifications مركز إشعارات | غير موجود |
| Recently Viewed | غير موجود |
| Product Q&A | غير موجود |
| Related Products محرك علاقات | غير موجود (recommendation data-source = fallback) |
| Collections كيان مستقل | نوع `collection` في data-source بدون تنفيذ منتجات |
| Faceted Search متقدم (attributes facets) | بحث نصي + فلاتر قائمة فقط |
| Invoice / Refund / Exchange / Return كيانات مستقلة | غير موجودة (حالات طلب محدودة) |
| Marketing / Reports لوحة متجر | `/overview` و `/customers` يعاد توجيههما |
| Roles/Permissions دقيقة للمتجر | تمكين وحدة `ecommerce` فقط — بلا أكواد صلاحيات فرعية |
| Analytics (GA/Pixels) في الإعدادات | غير موجود في UI الإعدادات |
| Theme colors editor في الإعدادات | حقل في النوع فقط — بلا تبويب تعديل |
| محرر قوائم Navigation/Footer الكامل | أنواع + mocks؛ UI الإدارة يحرر الإعلان والسجل التجاري فقط جزئياً |
| Media library backend | تعليق في الكود: endpoint غير منفّذ |
| Wishlist خادم دائم | Zustand بدون persist |
| Cart خادم دائم | localStorage فقط |

### 0.3 حالة التنفيذ الحالية (Frontend)

| طبقة | مصدر البيانات |
|------|----------------|
| كتالوج (منتجات/تصنيفات/علامات) | HTTP عام: `/public/inventory/*` |
| إعدادات الشركة / محتوى / صفحة رئيسية | mocks داخلية (ذاكرة/JSON) |
| طلبات المتجر | mock + مزامنة اختيارية للوحة الإدارة |
| مصادقة الشريك | mock افتراضي؛ HTTP عند `NEXT_PUBLIC_PARTNER_AUTH_HTTP=true` |
| التقييمات | مولّدة محلياً (`reviews-mock.ts`) — عرض فقط |
| نموذج تواصل | نجاح وهمي بدون API |

---

## المرحلة الأولى — جرد الموديولات من الكود

### فهرس الموديولات الموجودة فعلياً

| # | الموديول | متجر | إدارة | جداول جديدة؟ |
|---|----------|------|-------|--------------|
| M01 | Company / Website Settings | ✓ | ✓ | نعم (`store_company_settings`…) |
| M02 | Catalog — Products | ✓ | ✓ | امتداد على inventory |
| M03 | Catalog — Categories | ✓ | ✓ | موجود في inventory |
| M04 | Catalog — Brands | ✓ | ✓ | موجود في inventory |
| M05 | Catalog — Attributes | ✓ | ✓ | موجود في inventory |
| M06 | Search | ✓ | — | فهارس فقط |
| M07 | Cart (عميل) | ✓ | — | اختياري لاحقاً؛ حالياً محلي |
| M08 | Wishlist | ✓ | — | نعم (للثبات) |
| M09 | Checkout & Shipping rules | ✓ | ✓ (إعدادات) | ضمن الطلبات + إعدادات |
| M10 | Orders | ✓ | ✓ | نعم |
| M11 | Partner Auth (عملاء المتجر) | ✓ | — | نعم (+ ربط partners) |
| M12 | CMS Content (About/Contact/FAQ/Legal) | ✓ | ✓ | نعم |
| M13 | CMS Page Builder (Homepage) | ✓ | ✓ جزئي | نعم |
| M14 | Announcement Bar | ✓ | ✓ | ضمن إعدادات الشركة |
| M15 | Store page visibility (offers/wholesale) | ✓ | ✓ | ضمن إعدادات الشركة |
| M16 | Product Reviews (عرض) | ✓ عرض | — | نعم إن أُريدت بيانات حقيقية |
| M17 | Admin Orders Kanban / Fulfilment | — | ✓ | جداول تخصيص المخزون |

---

## M01 — إعدادات موقع الشركة (Website / Company Config)

### الوصف
هوية المتجر، SEO الافتراضي، تواصل، شبكات اجتماعية، ثيم، تنقل، تذييل، شريط إعلانات، قواعد الدفع/الشحن، إظهار صفحات العروض والجملة.

### الصفحات
| سطح | مسار |
|-----|------|
| إدارة | `/cms/settings` (هوية، أشرطة، تواصل، اجتماعي، شحن/دفع، SEO) |
| إدارة | `/cms/navigation` (شريط الإعلانات فقط حالياً) |
| إدارة | `/cms/content` — مفاتيح إظهار offers/wholesale |
| متجر | يستهلك عبر `getStorefrontCompanyConfig` في كل الصفحات |

### مصدر الأنواع
`storefront/domain/company-config.ts`, `storefront-models.ts`

### Permissions (الواقع في الكود)
تمكين وحدة `ecommerce` / بلاطة `store-admin`. لا أكواد صلاحيات فرعية (`cms.settings.write` إلخ) في الكود.

### Validation (من الواجهة/الأنواع)
- `announcement.speedMs`: 3000–120000  
- `hero.intervalMs`: 1000–30000  
- روابط اجتماعية: URL + `enabled`  
- `checkout.paymentMethods`: مجموعة فرعية من `cash_on_delivery | card`  
- `storePages.offers|wholesale`: boolean  

### Enums

```sql
CREATE TYPE store_payment_method AS ENUM ('cash_on_delivery', 'card');
CREATE TYPE store_social_network AS ENUM (
  'instagram', 'twitter', 'facebook', 'whatsapp',
  'tiktok', 'youtube', 'snapchat', 'linkedin'
);
```

### SQL — جداول

```sql
-- إعدادات متجر واحدة لكل شركة (1:1 مع companies)
CREATE TABLE store_company_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  -- هوية
  store_name_ar TEXT NOT NULL,
  store_name_en TEXT NOT NULL DEFAULT '',
  logo_url TEXT NULL,
  favicon_url TEXT NULL,
  -- ثيم (HSL strings كما في الفرونت)
  theme_primary TEXT NOT NULL DEFAULT '160 40% 28%',
  theme_secondary TEXT NOT NULL DEFAULT '30 50% 50%',
  theme_accent TEXT NOT NULL DEFAULT '200 40% 40%',
  -- تواصل
  contact_phone TEXT NULL,
  contact_email TEXT NULL,
  contact_address TEXT NULL,
  -- SEO افتراضي
  seo_home_title_ar TEXT NOT NULL DEFAULT '',
  seo_home_title_en TEXT NOT NULL DEFAULT '',
  seo_home_description_ar TEXT NOT NULL DEFAULT '',
  seo_home_description_en TEXT NOT NULL DEFAULT '',
  seo_products_title_ar TEXT NOT NULL DEFAULT '',
  seo_products_title_en TEXT NOT NULL DEFAULT '',
  seo_products_description_ar TEXT NOT NULL DEFAULT '',
  seo_products_description_en TEXT NOT NULL DEFAULT '',
  seo_keywords TEXT[] NOT NULL DEFAULT '{}',
  seo_default_og_image TEXT NULL,
  -- تذييل
  footer_copyright_owner_ar TEXT NOT NULL DEFAULT '',
  footer_copyright_owner_en TEXT NOT NULL DEFAULT '',
  footer_commercial_registration TEXT NULL,
  -- شريط إعلانات
  announcement_enabled BOOLEAN NOT NULL DEFAULT false,
  announcement_dismissible BOOLEAN NOT NULL DEFAULT true,
  announcement_scrolling BOOLEAN NOT NULL DEFAULT true,
  announcement_speed_ms INTEGER NOT NULL DEFAULT 28000
    CHECK (announcement_speed_ms BETWEEN 3000 AND 120000),
  -- شحن / دفع
  checkout_default_city TEXT NOT NULL DEFAULT 'صنعاء',
  checkout_free_shipping_threshold NUMERIC(14, 4) NOT NULL DEFAULT 200,
  checkout_standard_shipping_fee NUMERIC(14, 4) NOT NULL DEFAULT 25,
  checkout_payment_methods store_payment_method[] NOT NULL
    DEFAULT ARRAY['cash_on_delivery', 'card']::store_payment_method[],
  -- إظهار صفحات الكتالوج
  store_page_offers_enabled BOOLEAN NOT NULL DEFAULT true,
  store_page_wholesale_enabled BOOLEAN NOT NULL DEFAULT true,
  default_locale TEXT NOT NULL DEFAULT 'ar',
  currency_code TEXT NOT NULL DEFAULT 'YER',
  timezone TEXT NOT NULL DEFAULT 'Asia/Aden',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_checkout_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES store_company_settings(company_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (company_id, name)
);

CREATE INDEX idx_store_checkout_cities_company ON store_checkout_cities(company_id);

CREATE TABLE store_social_links (
  company_id UUID NOT NULL REFERENCES store_company_settings(company_id) ON DELETE CASCADE,
  network store_social_network NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (company_id, network)
);

CREATE TABLE store_nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES store_company_settings(company_id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('primary', 'secondary')),
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL CHECK (href = '/store' OR href LIKE '/store/%'),
  highlight BOOLEAN NOT NULL DEFAULT false, -- secondary فقط
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_store_nav_items_company ON store_nav_items(company_id, kind, sort_order);

CREATE TABLE store_footer_link_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES store_company_settings(company_id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE store_footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES store_footer_link_groups(id) ON DELETE CASCADE,
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE store_announcement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES store_company_settings(company_id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  message_ar TEXT NOT NULL,
  message_en TEXT NOT NULL DEFAULT '',
  href TEXT NULL CHECK (href IS NULL OR href = '/store' OR href LIKE '/store/%'),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_store_announcement_items_company
  ON store_announcement_items(company_id, enabled, sort_order);
```

### العلاقات
`companies 1—1 store_company_settings` → أبناء: cities, social, nav, footer groups/links, announcement items.

---

## M02–M05 — الكتالوج (Products / Categories / Brands / Attributes)

### الوصف
إدارة وعرض الكتالوج. **مصدر الحقيقة للمخزون والكتالوج الأساسي:** [`inventory-database-schema.md`](./inventory-database-schema.md). المتجر يقرأ عبر `/public/inventory/*`.

### الصفحات
| سطح | مسارات |
|-----|--------|
| متجر | `/store/products`, `/store/products/[slug]`, categories, brands, offers (`tag=deals`), wholesale (`tag=wholesale`) |
| إدارة | `/products`, `/categories`, `/brands`, `/attributes` (+ مسارات inventory المكافئة) |

### حقول العروض في Frontend غير موجودة بعد في `products` داخل وثيقة المخزون

أضف الامتداد التالي (من `domain/types/product.ts`):

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_new_product BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS new_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS is_today_deal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deal_price_amount NUMERIC(14, 4) NULL,
  ADD COLUMN IF NOT EXISTS deal_price_currency TEXT NULL,
  ADD COLUMN IF NOT EXISTS deal_days INTEGER NULL,
  ADD COLUMN IF NOT EXISTS deal_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wholesale_price_amount NUMERIC(14, 4) NULL,
  ADD COLUMN IF NOT EXISTS wholesale_price_currency TEXT NULL,
  ADD COLUMN IF NOT EXISTS wholesale_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS is_discounted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(6, 2) NULL
    CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),
  ADD COLUMN IF NOT EXISTS discount_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3, 2) NULL
    CHECK (rating_avg IS NULL OR (rating_avg >= 0 AND rating_avg <= 5)),
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

-- فهارس فلاتر العروض والبحث
CREATE INDEX IF NOT EXISTS idx_products_tags_gin ON products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_products_offer_deal
  ON products(company_id) WHERE is_today_deal = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_offer_wholesale
  ON products(company_id) WHERE is_wholesale = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_price
  ON products(company_id, price_amount) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (name_ar gin_trgm_ops); -- يتطلب CREATE EXTENSION pg_trgm;
```

### Enums (موجودة في inventory)
`product_status`, `stock_status`, `product_type`, `product_tracking`, `product_invoice_policy`, `attribute_display_type`, `variant_creation_mode`, `packaging_type`, `media_type`

### Validation (من نموذج المنتج في الإدارة)
- `sku`, `slug`, `nameAr` إلزامي  
- `status ∈ draft|active|archived`  
- متغيرات: `combinationKey` فريد لكل منتج؛ سعر/كمية على مستوى variant عند وجودها  
- وسائط: `MediaItem` `{ id, url, alt, type, position, isPrimary }`  

### Permissions
وحدة ecommerce / inventory — بلا تفصيل أدق في الكود.

### ملاحظات علاقات مهمة
- `quantity_cache` على المنتج = **كاش عرض فقط**؛ المصدر الحقيقي `location_stock` (وثيقة المخزون).  
- صفحات `/store/offers` و `/store/wholesale` تصفّي بـ **tag** (`deals` / `wholesale`) بالإضافة لأعلام العروض في مصادر الصفحة الرئيسية.

---

## M06 — البحث (Search)

### الوصف
بحث متوازي عن منتجات + تصنيفات + علامات تجارية بنص الاستعلام.

### الصفحات
`/store/search` · شريط البحث في الهيدر

### الجداول
لا جدول بحث منفصل في المرحلة الحالية. الاعتماد على فهارس `products` / `categories` / `brands` (+ اختياري لاحقاً: OpenSearch — انظر التحديات).

### Validation
- `q` نص؛ ترقيم صفحات للمنتجات  
- فلاتر قائمة المنتجات: `categoryId`, `brandId`, `tag`, `minPrice`, `maxPrice`, أعلام عروض، `sort`

---

## M07 — السلة (Cart)

### الوصف
عناصر السلة على العميل: `{ productId, variantId?, quantity }` — حالياً `localStorage` (`storefront-cart`).

### الصفحات
`/store/cart` → `/store/checkout`

### قرار Schema
**لا جدول إلزامي الآن** لمطابقة التنفيذ الحالي. إن لزم مزامنة أجهزة لاحقاً:

```sql
CREATE TABLE store_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  partner_id UUID NULL, -- إن وُجد جلسة شريك
  guest_token TEXT NULL, -- زائر
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (partner_id IS NOT NULL OR guest_token IS NOT NULL)
);

CREATE UNIQUE INDEX idx_store_carts_partner
  ON store_carts(company_id, partner_id) WHERE partner_id IS NOT NULL;
CREATE UNIQUE INDEX idx_store_carts_guest
  ON store_carts(company_id, guest_token) WHERE guest_token IS NOT NULL;

CREATE TABLE store_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES store_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, product_id, variant_id)
);
```

### غير موجود في السلة حالياً
كوبون، قسيمة، هدية، ضريبة، ملاحظات سلة.

---

## M08 — المفضلة (Wishlist)

### الوصف
قائمة `productIds` في الذاكرة فقط (تُفقد عند التحديث).

### الصفحات
`/store/wishlist` · زر قلب على البطاقة

```sql
CREATE TABLE store_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL, -- FK لاحقاً إلى partners(id)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, partner_id)
);

CREATE TABLE store_wishlist_items (
  wishlist_id UUID NOT NULL REFERENCES store_wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wishlist_id, product_id)
);
```

---

## M09–M10 — الدفع والطلبات (Checkout & Orders)

### الوصف
خطوات الدفع: عنوان → طريقة دفع → مراجعة. إنشاء طلب متجر + مزامنة لوحة الإدارة (Kanban، دفع، تخصيص مخازن، شحن بند).

### الصفحات
| سطح | مسار |
|-----|------|
| متجر | `/store/checkout`, `/store/orders`, `/store/orders/[orderNumber]` |
| إدارة | `/orders` (افتراضي kanban) |

### مصدر الأنواع
`storefront/domain/checkout.ts`, `domain/types/order.ts`

### Enums

```sql
CREATE TYPE store_order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);
-- ملاحظة: واجهة المتجر لا تعرض refunded في مسار التتبع؛ الإدارة تستخدمه.

CREATE TYPE store_payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TYPE store_order_source AS ENUM ('seed', 'storefront');

CREATE TYPE store_line_ship_status AS ENUM (
  'unassigned', 'assigned', 'partial', 'shipped'
);
```

### Validation
- عنوان: `fullName`, `phone`, `city`, `district`, `street` إلزامي؛ `notes`, `lat`, `lng`, `mapAddress` اختياري  
- `paymentMethod` ضمن إعدادات الشركة  
- عند `card`: `paymentProofUrls[]` اختياري في الواجهة (حتى 5 صور) — الحقل القديم `paymentProofUrl` للتوافق فقط  

- بنود: `quantity > 0`, أسعار لقطة عند الإنشاء  
- شحن: مجاني إن `subtotal >= freeShippingThreshold` وإلا `standardShippingFee`  

### SQL

```sql
CREATE TABLE store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  order_number TEXT NOT NULL,
  -- ربط عميل (شريك) — اختياري للضيف
  partner_id UUID NULL,
  customer_name_ar TEXT NOT NULL,
  phone TEXT NULL,
  status store_order_status NOT NULL DEFAULT 'pending',
  payment_method store_payment_method NOT NULL,
  payment_status store_payment_status NOT NULL DEFAULT 'pending',
  payment_proof_url TEXT NULL, -- deprecated: أول عنصر من المرفقات للتوافق
  payment_proof_urls TEXT[] NOT NULL DEFAULT '{}',
  source store_order_source NOT NULL DEFAULT 'storefront',
  locale TEXT NOT NULL DEFAULT 'ar',
  -- عنوان الشحن (مدمج كما في الفرونت)
  ship_full_name TEXT NOT NULL,
  ship_phone TEXT NOT NULL,
  ship_city TEXT NOT NULL,
  ship_district TEXT NOT NULL,
  ship_street TEXT NOT NULL,
  ship_notes TEXT NULL,
  ship_lat DOUBLE PRECISION NULL,
  ship_lng DOUBLE PRECISION NULL,
  ship_map_address TEXT NULL,
  -- مبالغ
  currency_code TEXT NOT NULL DEFAULT 'YER',
  subtotal_amount NUMERIC(14, 4) NOT NULL,
  shipping_fee_amount NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 4) NOT NULL,
  estimated_delivery_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, order_number)
);

CREATE INDEX idx_store_orders_company_status ON store_orders(company_id, status);
CREATE INDEX idx_store_orders_company_created ON store_orders(company_id, created_at DESC);
CREATE INDEX idx_store_orders_partner ON store_orders(company_id, partner_id);
CREATE INDEX idx_store_orders_city ON store_orders(company_id, ship_city);
CREATE INDEX idx_store_orders_payment ON store_orders(company_id, payment_method, payment_status);

CREATE TABLE store_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL,          -- لقطة
  product_slug TEXT NOT NULL,
  image_url TEXT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_amount NUMERIC(14, 4) NOT NULL,
  unit_price_currency TEXT NOT NULL,
  line_total_amount NUMERIC(14, 4) NOT NULL,
  ship_status store_line_ship_status NOT NULL DEFAULT 'unassigned',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_store_order_lines_order ON store_order_lines(order_id);

CREATE TABLE store_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  from_status store_order_status NULL,
  to_status store_order_status NOT NULL,
  changed_by UUID NULL, -- موظف نظام
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_order_status_history_order
  ON store_order_status_history(order_id, created_at);

-- تخصيص مخزون لبند الطلب (لوحة الإدارة)
CREATE TABLE store_order_line_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id UUID NOT NULL REFERENCES store_order_lines(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  location_id UUID NOT NULL REFERENCES warehouse_locations(id),
  quantity NUMERIC(18, 4) NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_store_order_line_allocations_line
  ON store_order_line_allocations(order_line_id);
```

### غير موجود (لا تُبنَ الآن)
جداول Invoice / Refund / Return / Exchange / Shipment carrier منفصلة — الواجهة تستخدم حالة الطلب + `ship_status` للبند فقط.

---

## M11 — مصادقة بوابة العملاء (Partner Auth)

### الوصف
تسجيل/دخول/ملف/خروج منفصل تماماً عن موظفي ERP. التوكن `typ=partner`.

### الصفحات
`/store/login`, `/store/register`, `/store/account`, `/store/forgot-password` (stub)

### مصدر الأنواع
`storefront/domain/partner-auth.ts`

### Enums

```sql
CREATE TYPE partner_account_kind AS ENUM ('customer', 'vendor', 'visitor');
```

### Validation
- تسجيل: `name` ≥ 2، `email` + `mobile` معاً، `password` ≥ 6، `accountKind` (المتجر يثبت `customer`)، `companyId` UUID  
- دخول: `identifier` (إيميل أو جوال) + `password`؛ `companyId` اختياري  

### SQL (جلسات البوابة — الهوية عبر partners)

```sql
-- حساب دخول مرتبط بشريك (توافق contacts-partners-design)
CREATE TABLE partner_auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- = userId في استجابة API
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL, -- REFERENCES partners(id)
  branch_id UUID NULL REFERENCES branches(id) ON DELETE SET NULL,
  email CITEXT NOT NULL,
  mobile TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  account_kind partner_account_kind NOT NULL DEFAULT 'customer',
  full_name_ar TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, email),
  UNIQUE (company_id, mobile)
);

CREATE INDEX idx_partner_auth_accounts_partner ON partner_auth_accounts(partner_id);

CREATE TABLE partner_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES partner_auth_accounts(id) ON DELETE CASCADE,
  token_jti UUID NOT NULL UNIQUE, -- يطابق access_token / يُبطل عند logout
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_auth_sessions_account
  ON partner_auth_sessions(account_id) WHERE revoked_at IS NULL;
```

### API الموجود في مواصفات الفرونت (للربط)
| Method | Path |
|--------|------|
| POST | `/public/partners/auth/register` |
| POST | `/public/partners/auth/login` |
| GET | `/public/partners/auth/me` |
| POST | `/public/partners/auth/logout` |

### خارج النطاق الآن
OTP، نسيت كلمة المرور، ربط سيريال جهاز.

---

## M12 — محتوى CMS (About / Contact / FAQ / Legal)

### الصفحات
متجر: `/store/about`, `/store/contact`, `/store/faq`, `/store/legal/[slug]`  
إدارة: `/cms/content?tab=pages|faq`

### Enums

```sql
CREATE TYPE store_legal_slug AS ENUM ('privacy', 'terms', 'returns');
```

### SQL

```sql
CREATE TABLE store_content_about (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  headline_ar TEXT NOT NULL DEFAULT '',
  headline_en TEXT NOT NULL DEFAULT '',
  intro_ar TEXT NOT NULL DEFAULT '',
  intro_en TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_content_about_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES store_content_about(company_id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE store_content_about_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES store_content_about(company_id) ON DELETE CASCADE,
  label_ar TEXT NOT NULL DEFAULT '',
  label_en TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE store_content_contact (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  headline_ar TEXT NOT NULL DEFAULT '',
  headline_en TEXT NOT NULL DEFAULT '',
  intro_ar TEXT NOT NULL DEFAULT '',
  intro_en TEXT NOT NULL DEFAULT '',
  hours_ar TEXT NOT NULL DEFAULT '',
  hours_en TEXT NOT NULL DEFAULT '',
  map_embed_url TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- نموذج التواصل: الواجهة لا ترسل للخادم حالياً — جدول اختياري عند التفعيل
CREATE TABLE store_contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL DEFAULT '',
  answer_ar TEXT NOT NULL,
  answer_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_faq_company ON store_faq_items(company_id, sort_order);

CREATE TABLE store_legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  slug store_legal_slug NOT NULL,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_ar TEXT NOT NULL DEFAULT '', -- HTML غني بعد تعقيم DOMPurify في الفرونت
  body_en TEXT NOT NULL DEFAULT '',
  seo_meta_title_ar TEXT NULL,
  seo_meta_title_en TEXT NULL,
  seo_meta_description_ar TEXT NULL,
  seo_meta_description_en TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
```

---

## M13 — منشئ الصفحة الرئيسية (Page Builder)

### الوصف
صفحة CMS واحدة للصفحة الرئيسية مع أقسام مُنمذجة.

### الصفحات
متجر: `/store`  
إدارة: `/cms/banners` (hero)، `/cms/store-settings` (عناوين/تفعيل/ترتيب أقسام محدودة)

### أنواع الأقسام الموجودة في الكود
`hero-carousel | category-grid | product-carousel | flash-sale | features-grid | brand-slider | banner`

### أنواع الصفحة / الحالة
`homepage | category-landing | brand-page | campaign | offer | custom`  
`draft | published | archived`

### DataSource kinds (في الأنواع)
`manual | category | tag | collection | query | recommendation`  
> `recommendation` وحل منتجات `collection` **غير منفّذين** بالكامل في المستودع الحالي.

### SQL

```sql
CREATE TYPE store_cms_page_type AS ENUM (
  'homepage', 'category-landing', 'brand-page', 'campaign', 'offer', 'custom'
);
CREATE TYPE store_cms_page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE store_section_type AS ENUM (
  'hero-carousel', 'category-grid', 'product-carousel', 'flash-sale',
  'features-grid', 'brand-slider', 'banner'
);
CREATE TYPE store_section_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE store_data_source_kind AS ENUM (
  'manual', 'category', 'tag', 'collection', 'query', 'recommendation'
);

CREATE TABLE store_cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  page_type store_cms_page_type NOT NULL,
  status store_cms_page_status NOT NULL DEFAULT 'draft',
  slug TEXT NULL, -- للصفحات غير homepage
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, page_type, slug)
);

CREATE INDEX idx_store_cms_pages_company ON store_cms_pages(company_id, page_type, status);

CREATE TABLE store_cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES store_cms_pages(id) ON DELETE CASCADE,
  section_type store_section_type NOT NULL,
  status store_section_status NOT NULL DEFAULT 'draft',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  -- محتوى/إعدادات/ستايل كـ JSONB مطابق لعقود section-definition
  content JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  style JSONB NOT NULL DEFAULT '{}',
  data_source_kind store_data_source_kind NOT NULL DEFAULT 'manual',
  data_source JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ NULL,
  created_by UUID NULL,
  updated_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_cms_sections_page ON store_cms_sections(page_id, sort_order);
CREATE INDEX idx_store_cms_sections_enabled ON store_cms_sections(page_id) WHERE enabled = true;
```

**شرائح Hero** تُخزَّن داخل `content.slides[]` (أو جدول فرعي اختياري إن رُغب تطبيع لاحق). الحقول من الكود: `id, imageUrl, enabled?, mobileImageUrl?, title?, alt?, href?` + `settings.intervalMs`, `settings.autoplay`.

---

## M16 — تقييمات المنتجات (عرض فقط حالياً)

### الوصف
واجهة PDP تعرض ملخصاً ومراجعات مولّدة محلياً. **لا يوجد إرسال تقييم من العميل.**

### قرار
إن أردت بيانات حقيقية لاحقاً (بدون بناء UI كتابة الآن):

```sql
CREATE TABLE store_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  partner_id UUID NULL,
  author_name TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_product_reviews_product
  ON store_product_reviews(product_id, is_published, created_at DESC);
```

حدّث `products.rating_avg` / `review_count` عبر trigger أو job — لا تحسبها في كل قراءة قائمة.

---

## ملخص العلاقات (ER منطقي)

```text
companies
  ├── store_company_settings ──┬── store_checkout_cities
  │                            ├── store_social_links
  │                            ├── store_nav_items
  │                            ├── store_footer_link_groups → store_footer_links
  │                            └── store_announcement_items
  ├── brands / categories / catalog_attributes / products … (inventory)
  ├── store_cms_pages → store_cms_sections
  ├── store_content_* / store_faq_items / store_legal_pages
  ├── partner_auth_accounts → partner_auth_sessions
  ├── store_orders → store_order_lines → store_order_line_allocations
  │                └── store_order_status_history
  └── store_wishlists → store_wishlist_items
```

---

## المرحلة الثانية — معمارية Backend عالية الأداء

### 1. المبادئ (مطبّقة على ما يحتاجه الفرونت فقط)

| مبدأ | التطبيق |
|------|---------|
| Clean Architecture | `interfaces (HTTP)` → `application (use-cases)` → `domain` → `infrastructure (DB/cache)` |
| SOLID | خدمة واحدة لكل حالة استخدام (`PlaceOrder`, `LoginPartner`, `PublishHomepage`) |
| DDD خفيف | Aggregates: `StoreOrder`, `StoreCompanySettings`, `CmsPage`, `PartnerAuthAccount`؛ الكتالوج يبقى في سياق Inventory |
| CQRS عند الحاجة فقط | فصل قراءة الكتالوج العام (Cache/Read models) عن كتابة الإدارة |
| Repository عند الحاجة فقط | منافذ قراءة كتالوج / طلبات / CMS — بدون طبقة Repository عمياء لكل جدول |

### 2. حدود السياقات (Bounded Contexts)

```text
Inventory Catalog (موجود)     ←── Public Catalog Read API
Store Commerce (جديد)         ←── Cart?/Checkout/Orders/Wishlist
Store CMS (جديد)              ←── Settings/Content/PageBuilder
Partner Identity (جديد+Contacts) ←── Public Partner Auth
ERP Identity (موجود)          ←── موظفين — ممنوع على مسارات /public/partners
```

### 3. طبقات API المقترحة (مطابقة الفرونت)

#### عام (بدون توكن موظف)

| مجموعة | أمثلة |
|--------|--------|
| Catalog | موجودة: `/public/inventory/products|categories|brands` — أضف حقول العروض في الاستجابة |
| Company | `GET /public/store/companies/:id/config` |
| CMS Page | `GET /public/store/pages/homepage` |
| Content | `GET /public/store/content/{about,contact,faq,legal}` |
| Checkout | `POST /public/store/orders` |
| Orders track | `GET /public/store/orders/:orderNumber` (+ تحقق هاتف/شريك) |
| Partner Auth | `/public/partners/auth/*` |
| Search | `GET /public/store/search?q=` |

#### إدارة (توكن موظف + وحدة ecommerce)

| مجموعة | أمثلة |
|--------|--------|
| Orders admin | CRUD حالة، دفع، تخصيص، شحن بند |
| CMS write | settings, content, sections, banners |
| Catalog write | عبر inventory APIs الحالية |

### 4. قواعد أداء إلزامية

1. **قوائم منتجات:** SELECT أعمدة البطاقة فقط (`id, slug, name, price, media primary, flags, rating`) — لا تُرجع attributes/variants كاملة في PLP.  
2. **PDP:** استعلام منتج + variants + attributes في 2–3 استعلامات مجمّعة (تجنّب N+1).  
3. **Cache:**  
   - Config الشركة و Homepage المنشورة: Redis TTL قصير + إبطال عند الحفظ  
   - قوائم الكتالوج الشائعة: cache مفتاحه `(companyId, filters hash, page)`  
4. **Indexes:** كما في SQL أعلاه + GIN للـ tags.  
5. **طلبات عالية المعدل:** إنشاء الطلب Transaction واحدة (order + lines + history)؛ رقم الطلب sequence لكل شركة.  
6. **Idempotency:** مفتاح `Idempotency-Key` على `POST /orders`.  
7. **Pagination:** دائماً `page/limit` مع سقف (مثلاً 50) كما في الفرونت.  
8. **لا Business Logic في Controllers** — التحقق في Application Service + Zod/class-validator مطابق لقواعد الفرونت.

### 5. نموذج قراءة Homepage

```text
GET /public/store/pages/homepage
  → settings + sections[enabled=true, status=published] مرتبة
  → لكل section: حل data_source في Application (manual IDs / category / tag / query)
  → لا تُرجع recommendation كمحرك ذكي حتى يُبنى في الفرونت
```

### 6. الأمن

| قاعدة | تفصيل |
|-------|--------|
| عزل التوكنات | Partner JWT ≠ Employee JWT؛ رفض متبادل بالمسار |
| Tenant | كل استعلام يقيّد `company_id` |
| HTML قانوني | خزّن كما هو بعد تعقيم خادمي (مطابق DOMPurify) |
| كلمات المرور | argon2/bcrypt؛ لا تُرجع الهاش أبداً |
| إثبات الدفع | رفع ملف إلى object storage؛ خزّن URL فقط |
| Rate limit | login/register/place-order |

### 7. هيكل مجلدات مقترح (NestJS مثالاً)

```text
apps/api/src/
  modules/
    store-commerce/     # orders, checkout pricing
    store-cms/          # settings, content, pages
    partner-auth/       # public auth
  shared/
    database/
    cache/
    auth/               # guards: PartnerAuthGuard, EmployeeAuthGuard
```

الكتالوج يبقى في وحدة Inventory الحالية.

---

## أهم التحديات التي ستواجهك مستقبلاً

مرتبّة حسب احتمال الألم التشغيلي مع نمو المتجر:

1. **فصل قراءة الكتالوج عن كتابة المخزون**  
   عند ملايين المنتجات، استعلامات PLP على جداول المخزون الثقيلة ستبطئ. ستحتاج Read Model / فهرس بحث (OpenSearch/Meilisearch) وموادّة حقول العرض (`primary_image`, سعر فعّال، أعلام عروض).

2. **حساب السعر الفعّال للعروض**  
   الفرونت يعتمد أعلام + تواريخ انتهاء + `dealPrice` / `discountPercent` / `wholesalePrice`. احسب `effective_price` في طبقة واحدة (DB generated column أو عند الفهرسة) وإلا ستتكرر الأخطاء بين PLP وCheckout.

3. **اتساق المخزون عند الطلب**  
   `quantity_cache` ليس مصدر حقيقة. حجز المخزون (reservation) عند `confirmed/processing` ضروري قبل الشحن وإلا overselling.

4. **الطلبات الضيفية مقابل الشريك**  
   التتبع اليوم يعتمد أرقام طلبات في `localStorage`. ستحتاج ربط `partner_id` أو تحقق هاتف+رقم طلب لتجنّب تسريب الطلبات.

5. **مزامنة Admin Order ↔ Storefront Order**  
   حالياً شكلان متقاربان (`Order` vs `StorefrontCustomerOrder`). وحّد الجدول (`store_orders`) مع حقول إدارة إضافية (allocations) حتى لا تنحرف الحالات.

6. **JSONB للأقسام مقابل التطبيع**  
   مرن للـ Page Builder لكن صعب للاستعلام («كل الصفحات التي تستخدم منتج X»). خطط لفهرس علاقات `section_product_refs` لاحقاً إن لزم.

7. **عدم وجود صلاحيات فرعية للمتجر**  
   اليوم يكفي تفعيل الوحدة. عند تعدد موظفين ستحتاج permissions مثل `store.orders.update_status`, `store.cms.publish`.

8. **الوسائط**  
   رفع الصور عبر `prompt` URL حالياً. ستحتاج Media Service + CDN + أحجام متعددة قبل الإنتاج الحقيقي.

9. **Wishlist/Cart المحلية**  
   فقدان البيانات وتعدد الأجهزة. جدول الخادم يصبح ضرورياً بعد إطلاق الحسابات الحقيقية.

10. **التقييمات الوهمية**  
    إن بقيت mocks في الإنتاج ستُفقد ثقة العملاء. إمّا إخفاؤها أو جدول حقيقي + اعتدال نشر.

11. **البحث الوجهي (Facets)**  
    الفرونت لا يطلب facets كاملة الآن؛ إضافتها لاحقاً تتطلب aggregations مكلفة — جهّز فهرس بحث مبكراً إن كان النمو متوقعاً.

12. **نسيت كلمة المرور / OTP**  
    الصفحة موجودة كـ stub؛ بناءها لاحقاً يحتاج جداول tokens منفصلة ومسار بريد/SMS — لا تخلطها مع جلسات الموظفين.

13. **Multi-company لنفس المعرّف**  
    مواصفة الدخول تدعم `companyId` اختياري عند التعدد — تأكد من uniqueness `(company_id, email|mobile)`.

14. **ذروة الطلبات**  
    آلاف الطلبات/دقيقة تحتاج: طوابير لفحص المخزون غير المتزامن، Idempotency، وتقسيم قراءة التتبع عن كتابة الإنشاء.

15. **ما لا يجب بناؤه مبكراً**  
    Coupons، Gift cards، Blog، Compare، Exchange — غيابها من الفرونت يعني تكلفة صيانة بلا عائد حتى تُطلب في الواجهة.

---

## قائمة تحقق قبل Production

- [ ] ترحيل جداول `store_*` + امتداد أعمدة عروض المنتجات  
- [ ] تفعيل Partner Auth HTTP وإبطال جلسات عند logout  
- [ ] `POST /public/store/orders` بمعاملة واحدة + رقم طلب فريد لكل شركة  
- [ ] إبطال كاش الإعدادات/الصفحة الرئيسية عند الحفظ من الإدارة  
- [ ] استجابة PLP نحيفة (بدون N+1 للوسائط — join للميديا الأساسية فقط)  
- [ ] عدم قبول توكن الموظف على `/public/partners/*` والعكس  
- [ ] إخفاء أو استبدال مراجعات الـ mock  
- [ ] عدم نشر جداول/APIs للكوبونات والمدونة والمقارنة حتى تظهر في Frontend  

---

## ملحق أ — أوامر ترحيل مجمّعة (Ecommerce-only)

> نفّذ بعد وجود `companies`, `branches`, جداول inventory (`products`, `product_variants`, `warehouses`, …) ويفضّل `partners`.  
> يتطلب: `CREATE EXTENSION IF NOT EXISTS pgcrypto;` ويفضّل `pg_trgm`, `citext`.

انسخ أقسام SQL من هذه الوثيقة بالترتيب:

1. Enums المشتركة للمتجر (`store_payment_method`, `store_order_status`, …)  
2. `store_company_settings` والأبناء  
3. `ALTER TABLE products` (أعلام العروض + تقييمات كاش)  
4. `store_orders*`  
5. `partner_auth_*`  
6. `store_content_*` / FAQ / Legal  
7. `store_cms_pages` / `store_cms_sections`  
8. `store_wishlists*` (عند الحاجة)  
9. `store_carts*` (عند الحاجة)  
10. `store_product_reviews` (عند الاستغناء عن الـ mock)  

---

## ملحق ب — خريطة سريعة: صفحة Frontend → موارد Backend

| صفحة Frontend | قراءة | كتابة |
|---------------|-------|-------|
| `/store` | homepage page + config | — |
| `/store/products` | products list | — |
| `/store/products/[slug]` | product detail (+ reviews read) | — |
| `/store/search` | search | — |
| `/store/cart` | محلي حالياً | محلي |
| `/store/checkout` | config.checkout + products | `POST orders` |
| `/store/orders*` | order by number | — |
| `/store/login|register|account` | me | auth APIs |
| `/store/wishlist` | محلي / لاحقاً API | — |
| `/orders` (admin) | orders list/filters | status, payment, allocations, ship |
| `/products` (admin) | inventory products | inventory write |
| `/cms/*` | company/content/pages | CMS write |

---

*نهاية الوثيقة — مبنية حصراً على ما هو موجود في كود المشروع بتاريخ التحليل، مع إشارة صريحة لما هو غير موجود وما سيؤلم لاحقاً.*
