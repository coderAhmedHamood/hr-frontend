# Contacts API

> تطبيق **جهات الاتصال** (`contacts`). جدول `partners` كجذر + الجداول التابعة (عناوين، قنوات، علاقات، تصنيفات، ملاحظات، مرفقات، أنشطة).
> متوافق مع [`contacts-database-schema.md`](./contacts-database-schema.md).

---

## أساسيات

| البند | القيمة |
|------|--------|
| Base | `/contacts/...` |
| Auth | `Authorization: Bearer <token>` |
| صلاحيات | `cnt.<resource>.create` / `read` / `update` / `delete` |
| أرشفة | Soft archive عبر `archivedAt` فقط (لا عمود `is_archived`). الاستجابة تُرجع `isArchived` |
| قوائم | `page`, `limit`, `archiveScope` (`active` \| `archived` \| `all`) |
| الشركة | تُؤخذ من `partner` عند إنشاء أي صف تابع (لكنها تُخزَّن في `company_id`) |

كل صف تابع يتطلب `partnerId` لجهة **غير مؤرشفة**، وإلا `404`.

---

## Endpoints

جميع المسارات التالية تدعم `POST /` · `GET /` · `GET /:id` · `PATCH /:id` · `DELETE /:id` (أرشفة، 204)
ما لم يُذكر خلاف ذلك.

| Resource | Base path | Permission prefix |
|----------|-----------|-------------------|
| Partners | `/contacts/partners` | `cnt.partners` |
| Addresses | `/contacts/partner-addresses` | `cnt.partner-addresses` |
| Channels | `/contacts/partner-channels` | `cnt.partner-channels` |
| Relations | `/contacts/partner-relations` | `cnt.partner-relations` |
| Categories | `/contacts/partner-categories` | `cnt.partner-categories` |
| Category members | `/contacts/partner-category-members` | `cnt.partner-category-members` |
| Notes | `/contacts/partner-notes` | `cnt.partner-notes` |
| Attachments | `/contacts/partner-attachments` | `cnt.partner-attachments` |
| Activities | `/contacts/partner-activities` | `cnt.partner-activities` |

**Category members** استثناء: `POST /` · `GET /` · `DELETE /:partnerId/:categoryId` (حذف نهائي، لا أرشفة) — الصلاحيات `read` / `create` / `delete` فقط.

---

## Enums

| Enum | القيم |
|------|-------|
| `partnerStatus` | `draft`, `active`, `inactive`, `archived` |
| `addressType` | `main`, `billing`, `shipping`, `warehouse`, `branch`, `other` |
| `channelType` | `mobile`, `phone`, `email`, `website`, `whatsapp`, `linkedin`, `twitter`, `facebook`, `instagram`, `other` |
| `relationType` | `parent_company`, `child_contact`, `billing_contact`, `shipping_contact`, `emergency_contact`, `guardian`, `owner`, `other` |
| `activityType` | `note`, `call`, `meeting`, `email`, `task`, `message` |
| `activityStatus` | `planned`, `done`, `cancelled` |

جميعها `varchar` في قاعدة البيانات (ليست أنواع ENUM في Postgres).

---

## 1. Partners — `/contacts/partners`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `companyId` | نعم | uuid |
| `name` | نعم | الاسم الأساسي |
| `displayName` | لا | إن لم يُرسل: `nameAr` → `nameEn` → `name` |
| `branchId`, `parentId`, `userId` | لا | نفس الشركة |
| `status` | لا | افتراضي `active` |
| `isCompany`, `isCustomer`, `isVendor`, `isEmployee`, `isInternal` | لا | أعلام |
| `email`, `mobile`, `phone`, `website` | لا | |
| `taxNumber`, `commercialRegistration`, `industry`, `jobTitle`, `department` | لا | |
| `languageCode` (`ar`), `currencyCode` (`SAR`), `timezone` | لا | |
| `paymentTerms`, `creditLimitAmount`, `creditLimitCurrency`, `preferredPaymentMethod` | لا | `creditLimitAmount` يُرجع string |
| `notes`, `tags`, `refCode` | لا | `refCode` فريد لكل شركة بين غير المؤرشفين → 409 |

**Filters:** `id`, `companyId`, `branchId`, `parentId`, `status`, `isCompany`, `isCustomer`, `isVendor`, `isEmployee`, `isInternal`, `email`, `mobile`, `taxNumber`, `refCode`, `search`

---

## 2. Addresses — `/contacts/partner-addresses`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `partnerId` | نعم | مصدر الشركة |
| `addressType` | لا | افتراضي `main` |
| `label`, `isDefault` | لا | |
| `countryCode`, `state`, `city`, `district`, `street`, `building`, `postalCode` | لا | |
| `latitude`, `longitude` | لا | تُرسل أرقامًا وتُرجع نصًا بسبعة أرقام عشرية |
| `notes` | لا | |

`isDefault: true` (في الإنشاء أو التحديث) يُلغي علم الافتراضي عن باقي العناوين النشطة لنفس `partner` + `addressType` — فهرس فريد جزئي في قاعدة البيانات.

**Filters:** `id`, `partnerId`, `companyId`, `addressType`, `isDefault`, `countryCode`, `city`, `search`

---

## 3. Channels — `/contacts/partner-channels`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `partnerId` | نعم | |
| `channelType` | نعم | |
| `value` | نعم | رقم / بريد / حساب / رابط |
| `label`, `isPrimary`, `isVerified`, `sortOrder` | لا | |

`isPrimary: true` يُلغي علم الأساسي عن باقي القنوات النشطة لنفس `partner` + `channelType`.

**Filters:** `id`, `partnerId`, `companyId`, `channelType`, `value`, `isPrimary`, `isVerified`, `search`

---

## 4. Relations — `/contacts/partner-relations`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `fromPartnerId` | نعم | مصدر الشركة |
| `toPartnerId` | نعم | نفس الشركة، ويجب أن يختلف عن المصدر → 400 |
| `relationType` | نعم | |
| `notes` | لا | |

`(from, to, relationType)` فريد بين غير المؤرشفين → 409.
التحديث يقبل `toPartnerId` و`relationType` و`notes`.

**Filters:** `id`, `companyId`, `fromPartnerId`, `toPartnerId`, `partnerId` (أي طرف), `relationType`, `search`

---

## 5. Categories — `/contacts/partner-categories`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `companyId` | نعم | |
| `nameAr` | نعم | |
| `slug` | لا | يُشتق من `nameAr` عند غيابه، ويُمرَّر دائمًا على slugify (يقبل العربية) |
| `nameEn`, `color`, `description`, `isActive` | لا | `isActive` افتراضي `true` |

`slug` فريد لكل شركة بين غير المؤرشفين → 409. الأرشفة تضبط `isActive = false`.

**Filters:** `id`, `companyId`, `slug`, `isActive`, `search`

**Seed:** `system:init` يُنشئ لكل شركة: `vip`, `supplier`, `customer`, `government`, `employee`, `partner`, `prospect`, `distributor`.

---

## 6. Category members — `/contacts/partner-category-members`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `partnerId` | نعم | مصدر الشركة |
| `categoryId` | نعم | نفس الشركة → 400 عند الاختلاف |

المفتاح الأساسي `(partnerId, categoryId)` — التكرار يُرجع 409. لا أرشفة: `DELETE /:partnerId/:categoryId` يحذف السجل نهائيًا (204).

**Filters:** `partnerId`, `categoryId`, `companyId`

---

## 7. Notes — `/contacts/partner-notes`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `partnerId` | نعم | |
| `body` | نعم | نص حر |
| `isPinned` | لا | المثبتة تظهر أولًا في القائمة |

**Filters:** `id`, `partnerId`, `companyId`, `isPinned`, `search`

---

## 8. Attachments — `/contacts/partner-attachments`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `partnerId` | نعم | |
| `fileName` | نعم | |
| `fileUrl` | نعم | |
| `mimeType`, `sizeBytes`, `label` | لا | `sizeBytes` يُرسل رقمًا ويُرجع نصًا (bigint) |

لا يوجد `updatedAt` في هذا الجدول (`updatedBy` فقط).

**Filters:** `id`, `partnerId`, `companyId`, `mimeType`, `label`, `search`

---

## 9. Activities — `/contacts/partner-activities`

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `partnerId` | نعم | |
| `activityType` | نعم | |
| `subject` | نعم | |
| `status` | لا | افتراضي `planned` |
| `branchId` | لا | يجب أن يكون في شركة الجهة |
| `body`, `dueAt`, `completedAt`, `assignedTo` | لا | |

عند صيرورة `status = done` و`completedAt` فارغًا يُضبط تلقائيًا على الآن.

**Filters:** `id`, `partnerId`, `companyId`, `branchId`, `activityType`, `status`, `assignedTo`, `dueFrom`, `dueTo`, `search`

---

## بعد التثبيت

```bash
npm run db:migrate      # partners + الجداول التابعة
npm run system:init     # تطبيق contacts + صلاحيات cnt.* + تصنيفات رسمية
```

امنح المستخدم/الدور صلاحيات `cnt.*` ثم استخدم Swagger تحت **Contacts - ...**.

---

## لاحقًا (لم يُبنَ بعد)

`partner_company_access` — مشاركة الجهة بين عدة شركات (Phase 2، معلّق في المخطط).
