# المواقع الجغرافية (Geo) — دليل الفرونت

عقد التزام بين الـ Backend ولوحة الإدارة + المتجر + جهات الاتصال.

**Migration:** `1783373644652-geo-locations.ts`  
**Base:** `{HOST}` (مثل `http://localhost:3000`)  
**JSON:** camelCase · Envelope: `{ status, message, data, error }`  
**DELETE:** أرشفة ناعمة → HTTP `204` (ما عدا ما يُذكر خلاف ذلك)

---

## 0) الفكرة

تسلسل ثابت لكل شركة:

```text
دولة (country)  →  مدينة (city)  →  حي/حارة (district)
```

| الاستخدام | أين |
|-----------|-----|
| إدارة الكتالوج | ERP: `/geo/...` |
| قوائم الشحن بالمتجر | Public: `/public/store/geo/...` |
| عنوان العميل | Contacts: `partner-addresses` + `countryId` / `cityId` / `districtId` |
| طلب المتجر | `POST /public/store/orders` → `address.countryId` / `cityId` / `districtId` |

### حقل مهم: `showInStore`

| القيمة | المعنى |
|--------|--------|
| `true` | يظهر في قوائم المتجر العامة وفي checkout |
| `false` | للإدارة / جهات الاتصال فقط — **لا** يظهر في `/public/store/geo/...` |

شروط الظهور بالمتجر معاً: غير مؤرشف + `isActive=true` + `showInStore=true`.

> قائمة `store_checkout_cities` القديمة ما زالت موجودة للتوافق. **المسار الجديد الموصى به** هو geo + `showInStore`.

---

## 1) لوحة الإدارة (ERP) — يحتاج JWT

**Auth:** `Authorization: Bearer <access_token>`

### الصلاحيات

| المورد | create | read | update | delete |
|--------|--------|------|--------|--------|
| دول | `system.organization.geo-countries.create` | `…read` | `…update` | `…delete` |
| مدن | `system.organization.geo-cities.create` | `…read` | `…update` | `…delete` |
| أحياء | `system.organization.geo-districts.create` | `…read` | `…update` | `…delete` |

بعد سحب الـ Backend: `npm run system:init` لمنح الصلاحيات للأدوار.

### Endpoints

| Method | Path | ملاحظة |
|--------|------|--------|
| POST | `/geo/countries` | إنشاء دولة |
| GET | `/geo/countries` | قائمة + فلاتر |
| GET | `/geo/countries/:id` | تفاصيل |
| PATCH | `/geo/countries/:id` | تعديل (يشمل تبديل `showInStore`) |
| DELETE | `/geo/countries/:id` | أرشفة → 204 |
| POST | `/geo/cities` | إنشاء مدينة |
| GET | `/geo/cities` | قائمة |
| GET | `/geo/cities/:id` | تفاصيل |
| PATCH | `/geo/cities/:id` | تعديل |
| DELETE | `/geo/cities/:id` | أرشفة → 204 |
| POST | `/geo/districts` | إنشاء حي |
| GET | `/geo/districts` | قائمة |
| GET | `/geo/districts/:id` | تفاصيل |
| PATCH | `/geo/districts/:id` | تعديل |
| DELETE | `/geo/districts/:id` | أرشفة → 204 |

### فلاتر القائمة المشتركة

`page`, `limit`, `archiveScope` (`active` | `archived` | `all`), `companyId`, `search`, `isActive`, `showInStore`

- المدن: أضف `countryId`
- الأحياء: أضف `cityId` (و`countryId` عبر الـ join إن وُجد في الـ API)

### Body — إنشاء دولة

```ts
{
  companyId: string;      // uuid *
  code: string;           // * مثل "YE" | "SA" — فريد لكل شركة (غير حساس لحالة الأحرف)
  nameAr: string;         // *
  nameEn?: string | null;
  sortOrder?: number;     // افتراضي 0
  isActive?: boolean;     // افتراضي true
  showInStore?: boolean;  // افتراضي false — فعّله ليظهر بالمتجر
  createdBy?: string | null;
}
```

### Body — إنشاء مدينة

```ts
{
  companyId: string;      // uuid *
  countryId: string;      // uuid * — نفس الشركة
  nameAr: string;         // * فريد تحت نفس الدولة
  nameEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  showInStore?: boolean;
  createdBy?: string | null;
}
```

### Body — إنشاء حي

```ts
{
  companyId: string;      // uuid *
  cityId: string;         // uuid * — نفس الشركة
  nameAr: string;         // * فريد تحت نفس المدينة
  nameEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  showInStore?: boolean;
  createdBy?: string | null;
}
```

### Response (نموذج دولة)

```ts
{
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
  showInStore: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}
```

المدينة تضيف `countryId`. الحي يضيف `cityId`.

### UI مقترح للوحة الإدارة

1. شاشة **الدول** → جدول + زر «ظهور بالمتجر» (toggle على `showInStore`).
2. عند اختيار دولة → شاشة/تاب **المدن** (`countryId` filter).
3. عند اختيار مدينة → **الأحياء**.
4. عند تفعيل الظهور بالمتجر على مدينة/حي، تأكد أن الأب أيضاً `showInStore=true` إن أردت سلسلة checkout كاملة.

### curl سريع

```bash
# دولة تظهر بالمتجر
curl -s -X POST "$HOST/geo/countries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyId":"COMPANY_UUID","code":"YE","nameAr":"اليمن","showInStore":true}'

# مدينة تحت الدولة
curl -s -X POST "$HOST/geo/cities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyId":"COMPANY_UUID","countryId":"COUNTRY_UUID","nameAr":"صنعاء","showInStore":true}'

# حي تحت المدينة
curl -s -X POST "$HOST/geo/districts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyId":"COMPANY_UUID","cityId":"CITY_UUID","nameAr":"حي السبعين","showInStore":true}'
```

---

## 2) المتجر العام (Storefront) — بدون توكن

للـ Select المتسلسل في صفحة الشحن / العنوان.

| Method | Path | Query |
|--------|------|-------|
| GET | `/public/store/geo/countries` | `companyId` * |
| GET | `/public/store/geo/cities` | `companyId` * + `countryId` * |
| GET | `/public/store/geo/districts` | `companyId` * + `cityId` * |

### Response item

```ts
{
  id: string;
  code?: string;          // للدول فقط (مثل YE)
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
}
```

الترتيب من السيرفر: `sortOrder` ثم `nameAr`.

### تدفق الواجهة

```text
1) GET countries?companyId=
2) المستخدم يختار دولة → GET cities?companyId=&countryId=
3) يختار مدينة → GET districts?companyId=&cityId=
4) عند الطلب أرسل الـ IDs + نصوص العرض (انظر §4)
```

عند تغيير الدولة: امسح اختيار المدينة والحي.  
عند تغيير المدينة: امسح اختيار الحي.

```bash
curl -s "$HOST/public/store/geo/countries?companyId=COMPANY_UUID"
curl -s "$HOST/public/store/geo/cities?companyId=COMPANY_UUID&countryId=COUNTRY_UUID"
curl -s "$HOST/public/store/geo/districts?companyId=COMPANY_UUID&cityId=CITY_UUID"
```

---

## 3) جهات الاتصال — عناوين الشريك

**Base:** `/contacts/partner-addresses`  
**صلاحيات:** `cnt.partner-addresses.*`

### حقول جديدة في Create / Update / Response

| حقل | نوع | ملاحظة |
|-----|-----|--------|
| `countryId` | uuid \| null | اختياري — من `/geo/countries` |
| `cityId` | uuid \| null | اختياري — من `/geo/cities` |
| `districtId` | uuid \| null | اختياري — من `/geo/districts` |

الحقول النصية القديمة تبقى:

- `countryCode`, `city`, `district`, …

إن أرسلت `cityId` / `districtId` بدون نص، السيرفر يملأ `city` / `district` / `countryCode` من كتالوج الـ geo تلقائياً.

### مثال إنشاء عنوان مرتبط بالـ geo

```json
{
  "partnerId": "PARTNER_UUID",
  "addressType": "shipping",
  "isDefault": true,
  "countryId": "COUNTRY_UUID",
  "cityId": "CITY_UUID",
  "districtId": "DISTRICT_UUID",
  "street": "شارع …",
  "building": "…"
}
```

في UI جهات الاتصال: نفس الـ Select المتسلسل (يفضّل استخدام `/geo/...` الإداري أو نفس الـ public إن كانت العناصر ظاهرة بالمتجر فقط — للإدارة استخدم `/geo/...` لترى الكل).

---

## 4) طلب المتجر — `POST /public/store/orders`

داخل `address`:

```ts
{
  fullName: string;
  phone: string;

  // جديد — مفضّل للمتجر
  countryId?: string | null;
  cityId?: string | null;
  districtId?: string | null;

  // ما زال مطلوباً كنص (لقطة عرض / توافق)
  city: string;       // إن وُجد cityId قد يستبدل السيرفر الاسم من الـ geo
  district: string;   // إن وُجد districtId قد يستبدل السيرفر الاسم من الـ geo
  street: string;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapAddress?: string | null;
}
```

### قواعد مهمة

1. إن أُرسل `cityId` / `districtId` / `countryId` يجب أن تكون لنفس `companyId` وأن تكون **`showInStore=true`** وإلا `400`.
2. أرسل دائماً `city` و`district` كنص (من `nameAr` للخيار المختار) حتى لو أرسلت الـ IDs.
3. الاستجابة تعرض أيضاً: `shipCountryId`, `shipCityId`, `shipDistrictId` + النصوص `shipCity`, `shipDistrict`.

### مثال address عند الدفع

```json
{
  "fullName": "أحمد",
  "phone": "777000111",
  "countryId": "COUNTRY_UUID",
  "cityId": "CITY_UUID",
  "districtId": "DISTRICT_UUID",
  "city": "صنعاء",
  "district": "حي السبعين",
  "street": "شارع الزبيري"
}
```

---

## 5) Checklist للفرونت

### لوحة ERP

- [ ] صفحات CRUD: دول / مدن / أحياء
- [ ] فلترة المدن بـ `countryId` والأحياء بـ `cityId`
- [ ] Toggle **`showInStore`**
- [ ] صلاحيات `system.organization.geo-*`
- [ ] أرشفة عبر DELETE وعرض `archiveScope`

### المتجر

- [ ] Select دولة → مدينة → حي من `/public/store/geo/...`
- [ ] عند الطلب: إرسال `countryId` + `cityId` + `districtId` + نصوص `city` / `district`
- [ ] إعادة تعيين الاختيارات عند تغيير الأب
- [ ] (اختياري) التوقف عن الاعتماد على `checkoutCities` القديمة إن انتقلتم بالكامل للـ geo

### جهات الاتصال

- [ ] في نموذج العنوان: Select متسلسل مربوط بـ `countryId` / `cityId` / `districtId`
- [ ] عرض الـ IDs في تفاصيل العنوان إن وُجدت

---

## 6) أخطاء شائعة

| الحالة | النتيجة المتوقعة |
|--------|-------------------|
| `code` مكرر لنفس الشركة | `409` |
| `nameAr` مكرر تحت نفس الدولة/المدينة | `409` |
| مدينة تابعة لدولة شركة أخرى | `400` |
| `cityId` بدون `showInStore` في طلب المتجر | `400` |
| قائمة public فارغة | غالباً لم يُفعَّل `showInStore` في الإدارة |

---

## 7) بعد تحديث الـ Backend

```bash
npm run db:migrate      # يشمل 1783373644652-geo-locations
npm run system:init     # صلاحيات geo
```

Swagger: ابحث عن **Geo - Countries / Cities / Districts** و **Public - Store** (`geo/...`).
