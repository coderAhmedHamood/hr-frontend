# أسعار التوصيل (Delivery Rates) — دليل الفرونت

عقد التزام لتسعير الشحن حسب **المدينة / الحي** لكل **شركة** وضمن **دولة** من كتالوج الـ geo.

**Migration:** `1783373644658-store-delivery-rates.ts`  
**صلاحيات:** `sta.delivery-rates.read|create|update|delete`  
**بعد السحب:** `npm run db:migrate` ثم `npm run system:init` (لتسجيل الصلاحيات)

---

## الفكرة

قاعدة واحدة (`store_delivery_rates`) + أهداف متعددة:

| `scopeType` | الأهداف | المعنى |
|-------------|---------|--------|
| `city` | `cityIds[]` (1 أو أكثر) | **سعر واحد** لمدينة أو عدة مدن كاملة |
| `district` | `districtIds[]` (1 أو أكثر) | **سعر واحد** لحي أو عدة أحياء |

### أولوية الحساب عند الدفع

1. إن وُجد سعر **حي** مطابق لـ `districtId` → يُستخدم.
2. وإلا إن وُجد سعر **مدينة** مطابق لـ `cityId` → يُستخدم.
3. وإلا → `0` (الطلب مسموح بدون رسوم).

قيود مهمة:

- المدينة تظهر في **سعر مدينة نشط واحد** فقط لكل شركة.
- الحي يظهر في **سعر حي نشط واحد** فقط لكل شركة.
- كل الأهداف يجب أن تكون من **نفس الشركة + نفس الدولة** للسعر.
- لا تغيّر `scopeType` بعد الإنشاء — أنشئ سعراً جديداً إن احتجت.

---

## إدارة (Store Admin) — JWT

**Base:** `/store-admin/companies/:companyId/delivery-rates`

| Method | Path | Permission |
|--------|------|------------|
| `POST /` | إنشاء | `create` |
| `GET /` | قائمة (`countryId`, `scopeType`, `isActive`, `search`, `archiveScope`, صفحة) | `read` |
| `GET /:id` | تفاصيل | `read` |
| `PATCH /:id` | تعديل المبلغ / الاسم / الأهداف | `update` |
| `DELETE /:id` | أرشفة ناعمة → `204` | `delete` |
| `POST /:id/restore` | استعادة | `update` |

### إنشاء — مدينة أو عدة مدن

```http
POST /store-admin/companies/{companyId}/delivery-rates
Authorization: Bearer …
Content-Type: application/json

{
  "countryId": "…",
  "name": "صنعاء والمناطق المجاورة",
  "scopeType": "city",
  "amount": 1500,
  "cityIds": ["city-uuid-1", "city-uuid-2"]
}
```

### إنشاء — حي أو عدة أحياء

```json
{
  "countryId": "…",
  "name": "أحياء محددة داخل صنعاء",
  "scopeType": "district",
  "amount": 2000,
  "districtIds": ["district-uuid-a", "district-uuid-b"]
}
```

`currencyCode` اختياري — الافتراضي عملة إعدادات المتجر.

### تعديل الأهداف

`PATCH` يستبدل القائمة بالكامل عند إرسال `cityIds` أو `districtIds` (حسب الـ scope فقط):

```json
{ "amount": 1800, "cityIds": ["city-uuid-1", "city-uuid-3"] }
```

### شكل الاستجابة

```json
{
  "id": "…",
  "companyId": "…",
  "countryId": "…",
  "name": "…",
  "scopeType": "city",
  "amount": "1500.0000",
  "currencyCode": "YER",
  "cities": [{ "id": "…", "nameAr": "صنعاء", "nameEn": "Sanaa" }],
  "districts": [],
  "sortOrder": 0,
  "isActive": true,
  "isArchived": false,
  "archivedAt": null,
  "createdAt": "…",
  "updatedAt": "…"
}
```

---

## المتجر العام (Public)

### تقدير الرسوم قبل إنشاء الطلب

```http
GET /public/store/shipping-quote?companyId=…&cityId=…&districtId=…
```

```json
{
  "amount": "2000.0000",
  "currencyCode": "YER",
  "rateId": "…",
  "matchedScope": "district"
}
```

بدون تطابق: `amount: "0.0000"`, `rateId: null`, `matchedScope: null`.

### عند إنشاء الطلب

`POST /public/store/orders` يحسب `shippingFeeAmount` تلقائياً من نفس القواعد بعد التحقق من `address.cityId` / `address.districtId` — **لا تثق برقم الرسوم من الفرونت**.

---

## UI مقترح

1. اختر الدولة (من الدول المفعّلة للشركة).
2. زر «سعر مدن» → multi-select مدن + مبلغ.
3. زر «سعر أحياء» → اختر مدينة ثم multi-select أحياء + مبلغ.
4. في checkout: بعد اختيار المدينة/الحي استدعِ `shipping-quote` واعرض المبلغ.

تسلسل الإعداد مع الـ geo:

1. فعّل الدولة: `PATCH /geo/company-countries/:id { showInStore: true }`
2. فعّل المدن/الأحياء المطلوبة (`showInStore`)
3. أنشئ أسعار التوصيل أعلاه
