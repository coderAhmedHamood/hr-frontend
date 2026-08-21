# Store Admin — تقارير المتجر (Frontend Guide)

دليل لفريق الواجهة الأمامية لتطبيق **إدارة المتجر** (`store-admin`): كل endpoints التقارير، الفلاتر المشتركة، واقتراحات UI لتغني صاحب المتجر عن المتابعة اليدوية.

## المصادقة والصلاحيات

| البند | القيمة |
|---|---|
| Base URL | `/store-admin/reports` |
| Auth | `Authorization: Bearer {accessToken}` |
| Permission | `sta.reports.read` على مورد `store-sales-reports` |
| Swagger tag | `Store Admin - Reports` / `Store Admin - Sales Reports` |

بدون الصلاحية: `403 Forbidden`.

---

## الفلاتر المشتركة (معظم تقارير المبيعات)

تُمرَّر كـ query string على تقارير الطلبات/المبيعات (ما عدا `operations/summary`).

| Param | Type | Required | Description |
|---|---|:---:|---|
| `companyId` | uuid | ✓ | شركة المتجر |
| `from` | ISO date/datetime | | بداية الفترة (شامل) — `2026-08-01` |
| `to` | ISO date/datetime | | نهاية الفترة (شامل) |
| `status` | enum | | حالة طلب واحدة |
| `statuses` | enum[] | | عدة حالات — `statuses=confirmed,processing` أو تكرار param |
| `paymentStatus` | `pending\|paid\|failed\|refunded` | | |
| `paymentMethod` | `cash_on_delivery\|cash\|bank\|network\|wallet\|card\|other` | | |
| `paymentAccountId` | uuid | | حساب الدفع المختار عند checkout |
| `source` | `storefront\|seed` | | مصدر الطلب |
| `partnerId` | uuid | | عميل مسجّل (Contacts partner) |
| `hasPartner` | boolean | | `true` = مسجّل فقط، `false` = ضيوف فقط |
| `city` | string | | تطابق نص `shipCity` |
| `countryId` | uuid | | |
| `cityId` | uuid | | |
| `districtId` | uuid | | |
| `productId` | uuid | | طلبات تحتوي هذا المنتج |
| `variantId` | uuid | | |
| `categoryId` | uuid | | طلبات تحتوي منتجاً من التصنيف |
| `brandId` | uuid | | |
| `lineShipStatus` | `unassigned\|assigned\|partial\|shipped` | | طلبات فيها بند بهذه حالة شحن |
| `currencyCode` | string | | مثال `YER` |
| `minOrderTotal` | number | | حد أدنى لـ `totalAmount` |
| `maxOrderTotal` | number | | حد أقصى |
| `search` | string | | ILIKE على رقم الطلب / اسم العميل / الهاتف |
| `excludeCancelledRefunded` | boolean | | default `true` — يستبعد الملغى/المسترد من KPIs الإيراد |
| `limit` | 1–200 | | default `50` — للتقارير المرتّبة (منتجات، مدن، …) |
| `includeMargin` | boolean | | على `by-product` فقط — هامش من `costPrice` |

### سلوك `excludeCancelledRefunded`

- **افتراضي `true`**: إيرادات KPIs (`summary`, `timeseries`, `by-payment`, …) تستبعد `cancelled` و `refunded`.
- إذا حدّدت `status` أو `statuses` يُلغى الاستبعاد التلقائي — الفلتر الصريح له الأولوية.
- `by-status` يعرض كل الحالات حسب الفلاتر الأخرى.

---

## 1. لوحة التحكم (نقطة دخول واحدة)

```
GET /store-admin/reports/dashboard?companyId={uuid}
```

### Params إضافية

| Param | Default | Description |
|---|---|---|
| `comparePreviousPeriod` | `true` | مقارنة KPIs بفترة سابقة بنفس الطول |
| `timeseriesGranularity` | `day` | `day \| week \| month` |

بدون `from`/`to`: **آخر 30 يوم** مقابل **30 يوم قبلها**.

### Response (مختصر)

```json
{
  "current": { "ordersCount": 120, "revenueTotal": "450000.0000", "averageOrderValue": "3750.0000", "unitsSold": 340, "...": "..." },
  "previous": { "...": "..." },
  "changePercent": {
    "ordersCount": 12.5,
    "revenueTotal": 8.3,
    "averageOrderValue": -2.1,
    "unitsSold": 15.0
  },
  "alerts": {
    "pendingFulfillmentOrdersCount": 8,
    "pendingPaymentOrdersCount": 5,
    "unassignedLineUnitsCount": 23,
    "contactMessagesInPeriodCount": 4,
    "pendingReviewsCount": 2,
    "overdueDeliveryOrdersCount": 1
  },
  "timeseries": { "granularity": "day", "points": [] },
  "byStatus": [],
  "byPayment": []
}
```

### UI مقترح

- **بطاقات KPI** من `current` + سهم % من `changePercent` (null = لا مقارنة أو القيمة السابقة 0).
- **تنبيهات** من `alerts` — روابط deep-link لشاشات الطلبات / الرسائل / التقييمات.
- **رسم بياني** من `timeseries.points`.
- **دونات** من `byStatus` و `byPayment`.

---

## 2. تقارير المبيعات (`/store-admin/reports/sales/*`)

| Endpoint | Use case |
|---|---|
| `GET .../sales/summary` | KPIs تفصيلية |
| `GET .../sales/timeseries` | + `granularity` |
| `GET .../sales/by-status` | توزيع حالات الطلب |
| `GET .../sales/by-payment` | طريقة + حالة الدفع |
| `GET .../sales/by-city` | أفضل المدن |
| `GET .../sales/by-product` | أفضل المنتجات (+ `includeMargin=true`) |
| `GET .../sales/by-partner` | أفضل العملاء + bucket الضيوف |
| `GET .../sales/lines` | جدول صفحي على مستوى **سطر منتج** (تصدير Excel) |

### Pagination — `lines`

| Param | Default |
|---|---|
| `page` | 1 |
| `limit` | 200 |

---

## 3. تقارير إضافية (`/store-admin/reports/*`)

| Endpoint | Description |
|---|---|
| `GET .../geo/by-district` | مبيعات حسب الحي/المنطقة |
| `GET .../payments/by-account` | حسب حساب الدفع (snapshot) + مدفوع/غير مدفوع |
| `GET .../catalog/by-category` | إيراد حسب تصنيف الكatalog |
| `GET .../catalog/by-brand` | إيراد حسب العلامة |
| `GET .../fulfillment/by-ship-status` | `unassigned` / `assigned` / `partial` / `shipped` |
| `GET .../orders/by-source` | `storefront` vs `seed` |
| `GET .../operations/summary` | رسائل اتصل بنا + wishlist + تقييمات |

### Operations — فلاتر بسيطة

```
GET /store-admin/reports/operations/summary?companyId={uuid}&from=2026-08-01&to=2026-08-31
```

```json
{
  "contactMessagesByType": [{ "type": "suggestion", "count": 3 }],
  "contactMessagesTotal": 5,
  "wishlistAddsInPeriodCount": 12,
  "wishlistTotalActiveCount": 89,
  "reviewsSubmittedInPeriodCount": 7,
  "pendingReviewsCount": 2,
  "approvedReviewsCount": 40,
  "rejectedReviewsCount": 1,
  "averageApprovedRating": 4.35
}
```

---

## 4. خريطة شاشات UI (مقترحة)

| شاشة | APIs |
|---|---|
| **Dashboard** | `dashboard` |
| **مبيعات** | `summary` + `timeseries` + فلاتر |
| **المنتجات** | `by-product` (+ margin) + `catalog/by-category` + `catalog/by-brand` |
| **العملاء** | `by-partner` |
| **الجغرافيا** | `by-city` + `geo/by-district` |
| **الدفع** | `by-payment` + `payments/by-account` |
| **التنفيذ** | `fulfillment/by-ship-status` + alerts من dashboard |
| **التفاعل** | `operations/summary` |
| **تصدير** | `sales/lines` paginated → CSV client-side |

---

## 5. فلاتر UI موسّعة (UX)

### شريط فلاتر global

1. **فترة سريعة**: اليوم / 7 أيام / 30 يوم / هذا الشهر / مخصص → يضبط `from`/`to`.
2. **حالة متعددة**: multi-select → `statuses`.
3. **Geo cascade**: `countryId` → `cityId` → `districtId` (من APIs الـ geo العامة أو store-admin).
4. **Catalog**: product picker → `productId` / category → `categoryId` / brand → `brandId`.
5. **دفع**: `paymentMethod` + `paymentStatus` + حساب → `paymentAccountId`.
6. **قيمة الطلب**: range slider → `minOrderTotal` / `maxOrderTotal`.
7. **نوع عميل**: الكل / مسجّل / ضيف → `hasPartner`.
8. **Toggle**: «استبعاد الملغى والمسترد» → `excludeCancelledRefunded`.

### مزامنة الفلاتر

- احفظ الفلاتر في URL query (deep-linking).
- عند تغيير فترة في Dashboard، أعد جلب `dashboard` + أي tab مفتوح بنفس الفلاتر.

---

## 6. أنواع البيانات

- **المبالغ**: strings بscale 4 — `"1234.5000"` (لا تستخدم float للعرض المحاسبي).
- **التواريخ**: ISO 8601 من الخادم؛ `periodKey` في timeseries: `YYYY-MM-DD` أو `YYYY-MM`.
- **النسب**: `changePercent.*` قيمة % (مثلاً `12.5` = +12.5%) أو `null`.

---

## 7. Enums (مرجع سريع)

**StoreOrderStatus**: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`

**StorePaymentStatus**: `pending`, `paid`, `failed`, `refunded`

**StoreLineShipStatus**: `unassigned`, `assigned`, `partial`, `shipped`

**StoreOrderSource**: `storefront`, `seed`

**StoreContactMessageType**: `complaint`, `suggestion`

---

## 8. Demo (شركة rose)

بعد `npm run seed:demo` توجد طلبات demo متنوعة الحالات والدفع والجغرافيا — مناسبة لاختبار كل التقارير.

```http
GET /store-admin/reports/dashboard?companyId={roseCompanyId}
Authorization: Bearer {tokenWithStaReportsRead}
```

---

## 9. Swagger

افتح `/api` (أو مسار Swagger في مشروعكم) وابحث عن:

- `Store Admin - Reports`
- `Store Admin - Sales Reports`

كل endpoint موثّق بالعربية مع وصف الفلاتر.
