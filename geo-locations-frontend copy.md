# مرجع عمليات الدولة / المدينة / الحي (API الحالي)

## قاعدة مهمة

| العملية | الدولة | المدينة | الحي |
|--------|--------|---------|------|
| إضافة | فقط `system:init` / seed | من الفرونت | من الفرونت |
| تفعيل بالمتجر | `PATCH /geo/company-countries/:id` | `PATCH /geo/cities/:id` | `PATCH /geo/districts/:id` |
| تعديل بيانات | محدود | نعم | نعم |
| أرشفة (حذف ناعم) | نعم | نعم | نعم |

التفعيل/إلغاء التفعيل = حقل `showInStore: true | false`

---

## 1) الدول المدعومة للشركة (المسار الموصى به للتفعيل)

Auth: JWT · صلاحيات `system.organization.geo-countries.*`

| Method | Path | الغرض |
|--------|------|--------|
| GET | `/geo/company-countries?companyId=` | قائمة الدول المدعومة |
| GET | `/geo/company-countries/:id` | تفاصيل الربط |
| PATCH | `/geo/company-countries/:id` | تفعيل / إلغاء بالمتجر |

```json
// PATCH — تفعيل
{ "showInStore": true }

// PATCH — إلغاء
{ "showInStore": false }
```

- لا يوجد POST أو DELETE هنا — الربط من الـ seed فقط.
- عند التفعيل يزامِن الـ Backend الدولة + المدن + الأحياء الموجودة تلقائياً.

---

## 2) كتالوج الدول `/geo/countries`

| Method | Path | الغرض | صلاحية |
|--------|------|--------|--------|
| GET | `/geo/countries` | قائمة | `…geo-countries.read` |
| GET | `/geo/countries/:id` | تفاصيل | `…read` |
| PATCH | `/geo/countries/:id` | تعديل كتالوج | `…update` |
| DELETE | `/geo/countries/:id` | أرشفة | `…delete` |

لا يوجد POST — لا إضافة دولة من الفرونت.

فلاتر القائمة: `companyId`, `search`, `isActive`, `showInStore`, `archiveScope` (`active|archived|all`), `page`, `limit`

```json
// PATCH /geo/countries/:id
{
  "nameAr": "اليمن",
  "nameEn": "Yemen",
  "code": "YE",
  "sortOrder": 0,
  "isActive": true,
  "showInStore": true
}
```

لتفعيل المتجر للشركة استخدم `company-countries` وليس هذا المسار.

---

## 3) المدن `/geo/cities`

| Method | Path | الغرض | صلاحية |
|--------|------|--------|--------|
| POST | `/geo/cities` | إضافة | `…geo-cities.create` |
| GET | `/geo/cities` | قائمة | `…read` |
| GET | `/geo/cities/:id` | تفاصيل | `…read` |
| PATCH | `/geo/cities/:id` | تعديل / تفعيل | `…update` |
| DELETE | `/geo/cities/:id` | أرشفة | `…delete` |
| POST | `/geo/cities/:id/restore` | استرجاع من الأرشيف | `…update` |

فلاتر: `companyId`, `countryId`, `search`, `isActive`, `showInStore`, `archiveScope`, `page`, `limit`

```json
// POST — إضافة
{
  "companyId": "…",
  "countryId": "…",
  "nameAr": "صنعاء",
  "nameEn": "Sanaa",
  "sortOrder": 0,
  "isActive": true,
  "showInStore": true
}

// PATCH — تعديل / تفعيل / إلغاء
{
  "nameAr": "صنعاء",
  "showInStore": true,
  "isActive": true
}

// PATCH — إلغاء من المتجر فقط
{ "showInStore": false }
```

**استرجاع:** `POST /geo/cities/:id/restore` — يمسح `archivedAt` ويعيد `isActive=true`.  
يفشل (409) إذا الأب مؤرشف، أو الاسم مكرر مع صف نشط، أو الصف غير مؤرشف.

---

## 4) الأحياء `/geo/districts`

| Method | Path | الغرض | صلاحية |
|--------|------|--------|--------|
| POST | `/geo/districts` | إضافة | `…geo-districts.create` |
| GET | `/geo/districts` | قائمة | `…read` |
| GET | `/geo/districts/:id` | تفاصيل | `…read` |
| PATCH | `/geo/districts/:id` | تعديل / تفعيل | `…update` |
| DELETE | `/geo/districts/:id` | أرشفة | `…delete` |
| POST | `/geo/districts/:id/restore` | استرجاع من الأرشيف | `…update` |

فلاتر: `companyId`, `cityId`, `countryId`, `search`, `isActive`, `showInStore`, `archiveScope`, `page`, `limit`

```json
// POST — إضافة
{
  "companyId": "…",
  "cityId": "…",
  "nameAr": "حي السبعين",
  "nameEn": "Al-Sabeen",
  "sortOrder": 0,
  "isActive": true,
  "showInStore": true
}

// PATCH — تفعيل / إلغاء
{ "showInStore": true }
{ "showInStore": false }
```

**استرجاع:** `POST /geo/districts/:id/restore` — نفس قواعد المدن (أب نشط، لا تعارض اسم، يجب أن يكون مؤرشفاً).

---

## 5) المتجر العام (قراءة فقط — بدون JWT)

فقط العناصر: غير مؤرشفة + `isActive` + `showInStore=true`

| Method | Path | Query |
|--------|------|--------|
| GET | `/public/store/geo/countries` | `companyId` * |
| GET | `/public/store/geo/cities` | `companyId` * + `countryId` * |
| GET | `/public/store/geo/districts` | `companyId` * + `cityId` * |

---

## ملخص سريع للفرونت

| العملية | المسار |
|---------|--------|
| الدول المدعومة | `GET /geo/company-countries?companyId=` |
| تفعيل/إلغاء دولة | `PATCH /geo/company-countries/:id` `{ showInStore }` |
| إضافة مدينة | `POST /geo/cities` |
| تعديل/تفعيل مدينة | `PATCH /geo/cities/:id` |
| أرشفة مدينة | `DELETE /geo/cities/:id` |
| استرجاع مدينة | `POST /geo/cities/:id/restore` |
| إضافة حي | `POST /geo/districts` |
| تعديل/تفعيل حي | `PATCH /geo/districts/:id` |
| أرشفة حي | `DELETE /geo/districts/:id` |
| استرجاع حي | `POST /geo/districts/:id/restore` |
