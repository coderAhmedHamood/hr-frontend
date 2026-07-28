# Contacts (Partners) — تصميم Master Data لنظام ERP

> تطبيق مستقل: **المرجع المركزي** لكل الأشخاص والكيانات.  
> لا كود تنفيذ في هذه الوثيقة — Domain → Schema → APIs → Services → UI.  
> متوافق مع أسلوب [`inventory-database-schema.md`](./inventory-database-schema.md) و [`inventory-api.md`](../inventory-api.md).

**وثائق مكمّلة:**
- [`contacts-database-schema.md`](./contacts-database-schema.md) — SQL كامل
- [`contacts-api.md`](./contacts-api.md) — REST API

---

## 0. قرارات معمارية ثابتة

| قرار | القيمة |
|------|--------|
| Aggregate Root | `Partner` |
| تسمية الوحدة | `contacts` (مسار UI) / جداول `partners*` (مثل Odoo res.partner) |
| Customer / Vendor | **أعلام على نفس السجل** — لا جداول منفصلة |
| Multi-company | `company_id` إجباري على كل سجل رئيسي |
| Multi-branch | `branch_id` اختياري (NULL = على مستوى الشركة) |
| Soft delete | `is_archived` + `archived_at` |
| Keys | UUID v4 |
| JSON API | camelCase |
| DB columns | snake_case |
| تكامل الوحدات | **فقط** `partner_id` (FK) — ممنوع جداول customers/vendors مستقلة |
| تمييز عن System Users | دليل مستخدمي النظام الحالي (`system.users.*`) **منفصل**؛ ربط اختياري لاحقًا عبر `user_id` |

---

## 1. Domain Model (DDD)

### 1.1 Bounded Context

```text
Contacts (Master Data)
  ├── Partner Identity & Classification
  ├── Hierarchy & Relations
  ├── Addresses
  ├── Communication Channels
  ├── Categories / Tags
  ├── Attachments & Notes
  └── Activities / Timeline
```

الوحدات الأخرى (CRM, Sales, Purchase, Inventory, Accounting, HR, …) **تستهلك** السياق عبر `PartnerId` ولا تملك نسخة من بيانات الهوية/العناوين.

### 1.2 Aggregate: Partner

```text
Partner (Root)
  ├── identity: name, displayName, isCompany, status
  ├── roles: isCustomer, isVendor, isEmployee, isInternal
  ├── parentPartnerId?          // هيكل هرمي (شركة ← أشخاص)
  ├── contact summary           // إيميل/جوال أساسي (denormalized للبحث)
  ├── business profile          // ضريبة، سجل، صناعة، لغة، عملة…
  ├── financial profile         // شروط دفع، حد ائتمان…
  ├── addresses[]               // Entity
  ├── channels[]                // Entity (phone/email/web/social)
  ├── categoryIds[]             // عبر PartnerCategoryMembership
  ├── tags[]                    // نصية حرة أو عبر categories
  ├── notes / attachments       // عبر جداول فرعية أو موديول مشترك
  └── activities[]              // Timeline
```

**Invariantات:**

1. كل `Partner` ينتمي لـ `company_id` واحد على الأقل في سياق السجل (أو جدول مشاركة لاحقًا؛ البداية: سجل واحد لكل شركة).
2. لا يمكن أن يكون `parent_id = self`.
3. لا دورات في شجرة `parent_id` (تحقق عند الربط).
4. داخل نفس العملية/الوحدة المستهلكة: الإشارة فقط بـ `partner_id`.
5. إن `is_company = false` يمكن ربطه بشركة أم؛ إن `is_company = true` يمكن أن يكون له أبناء أشخاص/فروع.
6. مزج الأدوار مسموح: `is_customer ∧ is_vendor` صحيح.

### 1.3 Value Objects

| VO | حقول |
|----|------|
| `PartnerId` | uuid |
| `CompanyId` / `BranchId` | uuid |
| `GeoPoint` | lat, lng |
| `MoneyLimit` | amount + currency |
| `PostalAddress` | country…postal (يُخزَّن كمصفوفة Address entities) |

### 1.4 Entities داخل الـ Aggregate

| Entity | مسؤولية |
|--------|---------|
| `PartnerAddress` | عنوان مُسمّى (main/billing/shipping/…) |
| `PartnerChannel` | وسيلة اتصال واحدة (mobile/phone/email/website/social) |
| `PartnerRelation` | علاقة مُصنَّفة بين شريكين (billing contact, guardian, …) |
| `PartnerCategory` | تصنيف قابل لإعادة الاستخدام (VIP, Government, …) |
| `PartnerNote` | ملاحظة |
| `PartnerAttachment` | مرفق (رابط تخزين) |
| `PartnerActivity` | نشاط Timeline (call, meeting, email, task) |

### 1.5 Domain Enums

```text
PartnerStatus:     draft | active | inactive | archived
PartnerKind:       company | person          // أو boolean is_company
AddressType:       main | billing | shipping | warehouse | branch | other
ChannelType:       mobile | phone | email | website | whatsapp | linkedin | twitter | facebook | instagram | other
RelationType:      parent_company | child_contact | billing_contact | shipping_contact
                   | emergency_contact | guardian | owner | other
ActivityType:      note | call | meeting | email | task | message
ActivityStatus:    planned | done | cancelled
ArchiveScope:      active | archived | all
```

> ملاحظة: علاقة `parent_id` على Partner تغطي الهيكل الهرمي الأساسي (Clean Life → Ahmed).  
> جدول `partner_relations` للعلاقات **الإضافية المسمّاة** (Billing Contact ≠ بالضرورة parent).

### 1.6 Ubiquitous Language

| مصطلح | المعنى |
|--------|--------|
| Partner | أي جهة (شخص أو شركة) |
| Contact | نفس Partner في سياق UI عربي «جهة اتصال» |
| Company Partner | `is_company = true` |
| Individual | `is_company = false` |
| Customer flag | يُستخدم في Sales/CRM — ليس كيانًا منفصلًا |
| Vendor flag | يُستخدم في Purchase — ليس كيانًا منفصلًا |

---

## 2. العلاقات (Relationships)

### 2.1 هرمية Parent / Children

```text
Partner (Clean Life, is_company=true)
  ├── Partner (Ahmed,  parent_id → Clean Life)
  ├── Partner (Mohammed, parent_id → Clean Life)
  └── Partner (Ali, parent_id → Clean Life)
```

- `partners.parent_id` → `partners.id` (nullable, same company)
- فهرس: `(company_id, parent_id)`

### 2.2 علاقات مسمّاة (PartnerRelation)

```text
Partner A ──billing_contact──▶ Partner B
Partner A ──shipping_contact─▶ Partner C
Partner Child ──guardian────▶ Partner ParentPerson
```

قيود: `from_partner_id` و `to_partner_id` لنفس `company_id`؛ منع self-relation.

### 2.3 تصنيفات

```text
PartnerCategory (VIP) ◀──M2M──▶ Partner
```

جدول `partner_category_members (partner_id, category_id)`.

### 2.4 استهلاك الوحدات الأخرى

```text
sales_orders.partner_id          → partners.id
purchase_orders.partner_id       → partners.id
crm_leads.partner_id             → partners.id   (أو convert لاحقًا)
warehouse_operations.partner_id  → partners.id   (بدل partner_name الحر تدريجيًا)
hr_employees.partner_id          → partners.id   (ملف شخصي مشترك)
accounting_moves.partner_id      → partners.id
ecommerce_customers.partner_id   → partners.id   (استبدال جدول customers المستقل)
```

**قاعدة ذهبية:** أي شاشة تحتاج اسم/جوال/عنوان تقرأ من Contacts API أو join على `partners` — لا تنسخ الحقول.

---

## 3. Clean Architecture — طبقات التنفيذ المقترحة

```text
src/features/contacts/
  domain/           # types, enums, invariants (لا I/O)
    types/
    constants/
    ports/          # PartnerRepositoryPort, PartnerQueryPort
  application/      # use-cases (CreatePartner, LinkRelation, …)
  infrastructure/   # API client / adapters
  admin/            # Next.js UI (list, kanban, form, detail)
    components/
    hooks/
    schemas/        # zod forms
    lib/api/
```

**اتجاه الاعتماديات:** `admin → application → domain ← infrastructure`

Backend (Nest أو ما يعادله) يطابق نفس الحدود:
`Controllers → Application Services → Domain → Persistence`

---

## 4. Database Schema (ملخص)

التفاصيل الكاملة في [`contacts-database-schema.md`](./contacts-database-schema.md).

| جدول | الغرض |
|------|--------|
| `partners` | الجذر |
| `partner_addresses` | عناوين متعددة |
| `partner_channels` | هواتف/إيميلات/سوشيال |
| `partner_relations` | علاقات مسمّاة |
| `partner_categories` | تصنيفات الشركة |
| `partner_category_members` | M2M |
| `partner_notes` | ملاحظات |
| `partner_attachments` | مرفقات |
| `partner_activities` | Timeline |
| `partner_company_access` | (اختياري لاحقًا) مشاركة عبر شركات |

حقول مشتركة على الجداول الرئيسية:

```text
id uuid PK
company_id uuid NOT NULL
branch_id uuid NULL
is_archived boolean DEFAULT false
archived_at timestamptz NULL
created_at / updated_at
created_by / updated_by varchar
```

---

## 5. Permissions

بادئة: `contacts.partners.*` و `contacts.categories.*`

| مورد | create | read | update | delete |
|------|--------|------|--------|--------|
| Partners | `contacts.partners.create` | `contacts.partners.read` | `contacts.partners.update` | `contacts.partners.delete` |
| Categories | `contacts.categories.create` | `contacts.categories.read` | `contacts.categories.update` | `contacts.categories.delete` |
| Activities | `contacts.activities.create` | `contacts.activities.read` | `contacts.activities.update` | `contacts.activities.delete` |
| Attachments | `contacts.attachments.create` | `contacts.attachments.read` | — | `contacts.attachments.delete` |

**Scope rules (سياسة قراءة):**

1. المستخدم يرى فقط `company_id ∈ allowed_companies`.
2. إن وُجدت قيود فروع: `branch_id IS NULL OR branch_id ∈ allowed_branches`.
3. دور/قسم: عبر claim في JWT أو جدول membership — تُطبَّق في query filter لا في إخفاء أعمدة فقط.
4. صلاحية `contacts.partners.read_sensitive` (اختياري) للحقول المالية (credit limit).

---

## 6. Application Services (Use Cases)

| Service | مسؤولية |
|---------|---------|
| `CreatePartner` | إنشاء مع عنوان/قناة أساسية اختيارية (transaction) |
| `UpdatePartner` | تحديث الهوية/الأعلام/الملف |
| `ArchivePartner` | soft delete + منع إن وُجدت قيود تشغيلية (اختياري) |
| `SetParent` | ربط هرمي مع فحص الدورات |
| `UpsertAddresses` | استبدال/دمج عناوين |
| `UpsertChannels` | استبدال/دمج قنوات |
| `LinkRelation` / `UnlinkRelation` | علاقات مسمّاة |
| `AssignCategories` | M2M |
| `AddNote` / `AddAttachment` / `ScheduleActivity` | Timeline |
| `SearchPartners` | بحث موحّد (اسم، جوال، إيميل، ضريبة، تصنيف، أدوار) |
| `GetPartnerGraph` | partner + children + relations (لتفاصيل الواجهة) |

---

## 7. REST APIs (ملخص)

التفاصيل في [`contacts-api.md`](./contacts-api.md).

```text
Base: {HOST}/contacts/...
Auth: Bearer JWT

/partners                         CRUD + list filters
/partners/:id                     get / patch / delete(archive)
/partners/:id/full                get nested (addresses, channels, relations, categories)
/partners/:id/addresses           nested CRUD أو عبر full
/partners/:id/channels
/partners/:id/relations
/partners/:id/notes
/partners/:id/attachments
/partners/:id/activities
/partner-categories               CRUD
```

Envelope موحّد مع باقي النظام (`status`, `message`, `data`, `error`).

---

## 8. واجهة المستخدم (Admin UI)

### 8.1 المسارات المقترحة

```text
/contacts                     قائمة (List / Kanban / Cards)
/contacts/new                 إنشاء
/contacts/:id                 تفاصيل (Tabs)
```

### 8.2 List View

- أعمدة: الاسم، النوع (شركة/شخص)، أدوار (شرائح)، جوال، إيميل، مدينة، حالة، فرع
- فلاتر: شركة، فرع، isCustomer، isVendor، isEmployee، تصنيف، حالة، بحث نصي
- إجراءات جماعية: أرشفة، تعيين تصنيف، تصدير

### 8.3 Kanban View

أعمدة حسب **الحالة** أو **التصنيف الأساسي** (قابل للتبديل):
`Prospect → Customer → VIP` أو `draft → active → inactive`

### 8.4 Card View

بطاقات: Avatar/Initials، Display Name، أدوار، قناة أساسية، مدينة.

### 8.5 Details View (Tabs)

| تبويب | محتوى |
|--------|--------|
| عام | الهوية، الأدوار، الشركة الأم، ملخص اتصال |
| عناوين | قائمة + تعيين افتراضي لكل نوع |
| وسائل الاتصال | قنوات متعددة |
| علاقات | children + relations المسمّاة |
| مالي | شروط دفع، حد ائتمان (حسب صلاحية) |
| أنشطة | Timeline |
| ملاحظات | Notes |
| مرفقات | Attachments |
| سجلات مرتبطة | Related Records (روابط للوحدات الأخرى عبر partner_id) |

### 8.6 Related Records (قراءة فقط من الموديولات)

استدعاءات خفيفة أو deep-links:

```text
طلبات البيع · أوامر الشراء · فواتير · حركات مخزون · تذاكر · مشاريع · موظف HR
```

كل بطاقة: عدّاد + رابط `/sales/orders?partnerId=` …

---

## 9. خطة التكامل التدريجي

| مرحلة | عمل |
|--------|-----|
| P0 | Schema + APIs Partners/Addresses/Channels/Categories |
| P1 | UI List + Form + Details |
| P2 | Relations + Activities + Attachments |
| P3 | استبدال `ecommerce` customers بـ `partner_id` |
| P4 | ربط Inventory operations بـ `partner_id` بدل الاسم الحر |
| P5 | HR employee ↔ partner، Accounting، CRM |

---

## 10. ما لن يُنفَّذ في P0

- محرك مشاركة متعددة الشركات الكامل (`partner_company_access`) — يُوثَّق كامتداد
- دمج تلقائي مع System Users directory
- Deduplication AI / merge partners
- بوابة عميل خارجية (تبقى عبر e-commerce session → partner)

---

## 11. معيار القبول (Definition of Done للتصميم)

- [x] Domain Model + Invariants
- [x] Schema SQL منفصل
- [x] API contract منفصل
- [x] Permissions + multi company/branch
- [x] UI IA (List/Kanban/Card/Details)
- [x] قاعدة Single Source of Truth عبر `partner_id`
- [ ] موافقة المنتج/Backend على الأسماء (`contacts` vs `partners` في URL)
- [ ] بعد الموافقة: تنفيذ Backend ثم Frontend وفق الطبقات أعلاه

---

**الخطوة التالية بعد موافقتك:** تنفيذ Backend وفق `contacts-database-schema.md` + `contacts-api.md`، ثم طبقة `src/features/contacts` في الفرونت.
