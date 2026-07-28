# Contacts / Partners API — دليل الربط للـ Frontend

> مرجع Backend لموديول جهات الاتصال (Master Data). متوافق مع:
> - [`contacts-partners-design.md`](./contacts-partners-design.md)
> - [`contacts-database-schema.md`](./contacts-database-schema.md)
>
> الحقول في JSON **camelCase** · في DB **snake_case**.

---

## 1. أساسيات الربط

| البند | القيمة |
|------|--------|
| Base URL | `{HOST}/contacts/...` |
| Auth | `Authorization: Bearer <access_token>` |
| Content-Type | `application/json` |
| Path params | كل `:id` من نوع **UUID v4** |
| Multi-company | معظم الطلبات تتطلب `companyId` (query أو body) |

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
    "limit": 50,
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

- **DELETE** الناجح غالباً يعيد **HTTP 204** (Soft Archive).
- الحقول الرقمية العشرية في Response غالباً **string**.
- القوائم تدعم: `page`, `limit`, `archiveScope` (`active` | `archived` | `all`).

---

## 2. الـ Enums

| Enum | القيم |
|------|--------|
| `PartnerStatus` | `draft`, `active`, `inactive`, `archived` |
| `PartnerAddressType` | `main`, `billing`, `shipping`, `warehouse`, `branch`, `other` |
| `PartnerChannelType` | `mobile`, `phone`, `email`, `website`, `whatsapp`, `linkedin`, `twitter`, `facebook`, `instagram`, `other` |
| `PartnerRelationType` | `parent_company`, `child_contact`, `billing_contact`, `shipping_contact`, `emergency_contact`, `guardian`, `owner`, `other` |
| `PartnerActivityType` | `note`, `call`, `meeting`, `email`, `task`, `message` |
| `PartnerActivityStatus` | `planned`, `done`, `cancelled` |
| `ArchiveScope` | `active`, `archived`, `all` |

---

## 3. Permissions

| المورد | create | read | update | delete |
|--------|--------|------|--------|--------|
| Partners | `contacts.partners.create` | `contacts.partners.read` | `contacts.partners.update` | `contacts.partners.delete` |
| Addresses | `contacts.addresses.create` | `contacts.addresses.read` | `contacts.addresses.update` | `contacts.addresses.delete` |
| Channels | `contacts.channels.create` | `contacts.channels.read` | `contacts.channels.update` | `contacts.channels.delete` |
| Relations | `contacts.relations.create` | `contacts.relations.read` | `contacts.relations.update` | `contacts.relations.delete` |
| Categories | `contacts.categories.create` | `contacts.categories.read` | `contacts.categories.update` | `contacts.categories.delete` |
| Notes | `contacts.notes.create` | `contacts.notes.read` | `contacts.notes.update` | `contacts.notes.delete` |
| Attachments | `contacts.attachments.create` | `contacts.attachments.read` | `contacts.attachments.update` | `contacts.attachments.delete` |
| Activities | `contacts.activities.create` | `contacts.activities.read` | `contacts.activities.update` | `contacts.activities.delete` |

### قواعد الرؤية (Authorization)

1. المستخدم يرى فقط شركاته (`companyId` في JWT / membership).
2. إن وُجد `branchId` على الـ Partner وقيود فرع للمستخدم → فلترة حسب الفروع المسموحة.
3. أدوار/أقسام يمكن تقييدها لاحقاً عبر policies (مثلاً موظفو HR فقط يرون `isEmployee`).

---

## 4. خريطة الجداول ↔ Endpoints

| جدول | Endpoint | CRUD |
|------|----------|------|
| `partners` | `/contacts/partners` | كامل + search + hierarchy |
| `partner_addresses` | `/contacts/partner-addresses` | كامل |
| `partner_channels` | `/contacts/partner-channels` | كامل |
| `partner_relations` | `/contacts/partner-relations` | كامل |
| `partner_categories` | `/contacts/partner-categories` | كامل |
| `partner_category_members` | عبر Partners أو endpoint مخصص | assign/unassign |
| `partner_notes` | `/contacts/partner-notes` | كامل |
| `partner_attachments` | `/contacts/partner-attachments` | كامل |
| `partner_activities` | `/contacts/partner-activities` | كامل |

---

## 5. Partners — `/contacts/partners`

| Method | Path | Permission | Status |
|--------|------|------------|--------|
| POST | `/contacts/partners` | create | 201 |
| GET | `/contacts/partners` | read | 200 (paginated) |
| GET | `/contacts/partners/:id` | read | 200 |
| GET | `/contacts/partners/:id/full` | read | 200 (مع عناوين/قنوات/تصنيفات/علاقات) |
| GET | `/contacts/partners/:id/children` | read | 200 |
| PATCH | `/contacts/partners/:id` | update | 200 |
| DELETE | `/contacts/partners/:id` | delete | 204 |
| POST | `/contacts/partners/:id/categories` | update | 200 |
| DELETE | `/contacts/partners/:id/categories/:categoryId` | update | 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `companyId` | نعم | uuid | |
| `branchId` | لا | uuid \| null | |
| `name` | نعم | string 1–255 | الاسم القانوني / الأساسي |
| `nameAr` | لا | string \| null | |
| `nameEn` | لا | string \| null | |
| `displayName` | لا | string | يُشتق من `name` إن لم يُرسل |
| `isCompany` | لا | boolean | افتراضي `false` |
| `status` | لا | `PartnerStatus` | افتراضي `active` |
| `imageUrl` | لا | string \| null | |
| `isCustomer` | لا | boolean | افتراضي `false` |
| `isVendor` | لا | boolean | افتراضي `false` |
| `isEmployee` | لا | boolean | افتراضي `false` |
| `isInternal` | لا | boolean | افتراضي `false` |
| `parentId` | لا | uuid \| null | شركة أب / جهة أب |
| `email` | لا | string \| null | أساسي (يُزامَن مع channel اختياريًا) |
| `mobile` | لا | string \| null | |
| `phone` | لا | string \| null | |
| `website` | لا | string \| null | |
| `taxNumber` | لا | string \| null | |
| `commercialRegistration` | لا | string \| null | |
| `industry` | لا | string \| null | |
| `jobTitle` | لا | string \| null | |
| `department` | لا | string \| null | |
| `languageCode` | لا | string | افتراضي `ar` |
| `currencyCode` | لا | string | افتراضي `SAR` |
| `timezone` | لا | string \| null | |
| `paymentTerms` | لا | string \| null | |
| `creditLimitAmount` | لا | number ≥0 \| null | |
| `creditLimitCurrency` | لا | string \| null | |
| `preferredPaymentMethod` | لا | string \| null | |
| `notes` | لا | string \| null | |
| `tags` | لا | string[] \| null | |
| `refCode` | لا | string \| null | فريد لكل شركة |
| `userId` | لا | uuid \| null | ربط مستخدم نظام |
| `categoryIds` | لا | uuid[] | اختياري عند الإنشاء |
| `createdBy` | لا | string \| null | |

### Update Body

نفس حقول Create **بدون** `companyId`، مع `updatedBy`. كلها اختيارية.  
`parentId: null` يفك الربط الهرمي.

### Query Filters

`page`, `limit`, `archiveScope`,  
`companyId`, `branchId`, `id`, `parentId`, `rootOnly` (boolean),  
`isCompany`, `status`,  
`isCustomer`, `isVendor`, `isEmployee`, `isInternal`,  
`nameContains`, `displayNameContains`, `email`, `emailContains`, `mobile`, `phone`,  
`taxNumber`, `refCode`, `industry`, `department`,  
`categoryId`, `tags` (مفصولة بفاصلة),  
`search` (name / displayName / email / mobile / tax / ref)

### Response Fields

`id`, `companyId`, `branchId`, `name`, `nameAr`, `nameEn`, `displayName`, `isCompany`, `status`, `imageUrl`,  
`isCustomer`, `isVendor`, `isEmployee`, `isInternal`, `parentId`,  
`email`, `mobile`, `phone`, `website`,  
`taxNumber`, `commercialRegistration`, `industry`, `jobTitle`, `department`,  
`languageCode`, `currencyCode`, `timezone`,  
`paymentTerms`, `creditLimitAmount` (string\|null), `creditLimitCurrency`, `preferredPaymentMethod`,  
`notes`, `tags`, `refCode`, `userId`,  
`isArchived`, `archivedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

### Full Response (`/full`)

نفس Partner +:

```json
{
  "addresses": [],
  "channels": [],
  "relations": [],
  "categories": [],
  "childrenCount": 0
}
```

---

## 6. Partner Addresses — `/contacts/partner-addresses`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/contacts/partner-addresses` | create |
| GET | `/contacts/partner-addresses` | read |
| GET | `/contacts/partner-addresses/:id` | read |
| PATCH | `/contacts/partner-addresses/:id` | update |
| DELETE | `/contacts/partner-addresses/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `partnerId` | نعم | uuid | |
| `addressType` | لا | `PartnerAddressType` | افتراضي `main` |
| `label` | لا | string \| null | |
| `isDefault` | لا | boolean | افتراضي `false` |
| `countryCode` | لا | string \| null | |
| `state` | لا | string \| null | |
| `city` | لا | string \| null | |
| `district` | لا | string \| null | |
| `street` | لا | string \| null | |
| `building` | لا | string \| null | |
| `postalCode` | لا | string \| null | |
| `latitude` | لا | number \| null | |
| `longitude` | لا | number \| null | |
| `notes` | لا | string \| null | |
| `createdBy` | لا | string \| null | |

`companyId` يُؤخذ من الـ Partner.

### Query Filters

`page`, `limit`, `archiveScope`, `id`, `companyId`, `partnerId`, `addressType`, `isDefault`, `cityContains`, `search`

---

## 7. Partner Channels — `/contacts/partner-channels`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/contacts/partner-channels` | create |
| GET | `/contacts/partner-channels` | read |
| GET | `/contacts/partner-channels/:id` | read |
| PATCH | `/contacts/partner-channels/:id` | update |
| DELETE | `/contacts/partner-channels/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `partnerId` | نعم | uuid | |
| `channelType` | نعم | `PartnerChannelType` | |
| `value` | نعم | string 1–500 | |
| `label` | لا | string \| null | |
| `isPrimary` | لا | boolean | |
| `isVerified` | لا | boolean | |
| `sortOrder` | لا | int ≥0 | |
| `createdBy` | لا | string \| null | |

عند تعيين `isPrimary=true` لنوع معين، يُلغى الـ primary السابق لنفس النوع.

---

## 8. Partner Relations — `/contacts/partner-relations`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/contacts/partner-relations` | create |
| GET | `/contacts/partner-relations` | read |
| GET | `/contacts/partner-relations/:id` | read |
| PATCH | `/contacts/partner-relations/:id` | update |
| DELETE | `/contacts/partner-relations/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع | ملاحظات |
|-------|-------|------|---------|
| `fromPartnerId` | نعم | uuid | المصدر |
| `toPartnerId` | نعم | uuid | الهدف — لا يساوي المصدر |
| `relationType` | نعم | `PartnerRelationType` | |
| `notes` | لا | string \| null | |
| `createdBy` | لا | string \| null | |

> الهرمية الأساسية عبر `partners.parentId`. جدول العلاقات للأدوار الدلالية (Billing / Shipping / Guardian…).

---

## 9. Partner Categories — `/contacts/partner-categories`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/contacts/partner-categories` | create |
| GET | `/contacts/partner-categories` | read |
| GET | `/contacts/partner-categories/:id` | read |
| PATCH | `/contacts/partner-categories/:id` | update |
| DELETE | `/contacts/partner-categories/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع |
|-------|-------|------|
| `companyId` | نعم | uuid |
| `slug` | نعم | string 1–80 |
| `nameAr` | نعم | string 1–120 |
| `nameEn` | لا | string \| null |
| `color` | لا | string \| null |
| `description` | لا | string \| null |
| `isActive` | لا | boolean |

---

## 10. Notes — `/contacts/partner-notes`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/contacts/partner-notes` | create |
| GET | `/contacts/partner-notes` | read |
| GET | `/contacts/partner-notes/:id` | read |
| PATCH | `/contacts/partner-notes/:id` | update |
| DELETE | `/contacts/partner-notes/:id` | delete → 204 |

### Create Body

`partnerId`, `body` (مطلوب), `isPinned`, `createdBy`

---

## 11. Attachments — `/contacts/partner-attachments`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/contacts/partner-attachments` | create |
| GET | `/contacts/partner-attachments` | read |
| GET | `/contacts/partner-attachments/:id` | read |
| PATCH | `/contacts/partner-attachments/:id` | update |
| DELETE | `/contacts/partner-attachments/:id` | delete → 204 |

### Create Body

`partnerId`, `fileName`, `fileUrl` (مطلوب), `mimeType`, `sizeBytes`, `label`, `createdBy`

> رفع الملف يتم عبر خدمة تخزين منفصلة؛ هذا الـ API يحفظ الميتاداتا فقط.

---

## 12. Activities — `/contacts/partner-activities`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/contacts/partner-activities` | create |
| GET | `/contacts/partner-activities` | read |
| GET | `/contacts/partner-activities/:id` | read |
| PATCH | `/contacts/partner-activities/:id` | update |
| DELETE | `/contacts/partner-activities/:id` | delete → 204 |

### Create Body

| الحقل | مطلوب | النوع |
|-------|-------|------|
| `partnerId` | نعم | uuid |
| `activityType` | نعم | `PartnerActivityType` |
| `subject` | نعم | string |
| `status` | لا | `PartnerActivityStatus` |
| `body` | لا | string \| null |
| `dueAt` | لا | ISO datetime \| null |
| `assignedTo` | لا | string \| null |
| `branchId` | لا | uuid \| null |
| `createdBy` | لا | string \| null |

### Query Filters

`partnerId`, `companyId`, `status`, `activityType`, `dueAtFrom`, `dueAtTo`, `assignedTo`, `search`

---

## 13. تسلسل بناء مقترح للـ Frontend

```text
1) Partner Categories
2) Partners (List / Kanban / Card)
3) Partner Detail (Full) + Addresses + Channels
4) Relations + Children hierarchy
5) Notes + Attachments
6) Activities (Timeline)
7) Integration: picker موحّد partner_id في Sales / Purchase / Inventory / HR / …
```

### عقد التكامل للوحدات الأخرى

```ts
// أي سجل تشغيلي
{ partnerId: string } // UUID → /contacts/partners/:id
```

لا تُنشأ جداول `customers` / `vendors` مستقلة لنفس المعنى.

---

## 14. أمثلة سريعة

### إنشاء شركة + شخص تابع

```http
POST /contacts/partners
{ "companyId": "...", "name": "Clean Life", "isCompany": true, "isCustomer": true, "isVendor": true }

POST /contacts/partners
{ "companyId": "...", "name": "Ahmed", "isCompany": false, "parentId": "<clean-life-id>", "email": "ahmed@..." }
```

### عنوان شحن

```http
POST /contacts/partner-addresses
{
  "partnerId": "...",
  "addressType": "shipping",
  "isDefault": true,
  "city": "Riyadh",
  "street": "..."
}
```
