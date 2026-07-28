# Contacts / Partners — Database Schema

> مصدر الحقيقة لبيانات الأشخاص والكيانات. متوافق مع [`contacts-partners-design.md`](./contacts-partners-design.md).  
> الأعمدة **snake_case** · المفاتيح **UUID** · أرشفة ناعمة · Multi-company / Multi-branch.

---

```sql
-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE partner_status AS ENUM ('draft', 'active', 'inactive', 'archived');

CREATE TYPE partner_address_type AS ENUM (
  'main',
  'billing',
  'shipping',
  'warehouse',
  'branch',
  'other'
);

CREATE TYPE partner_channel_type AS ENUM (
  'mobile',
  'phone',
  'email',
  'website',
  'whatsapp',
  'linkedin',
  'twitter',
  'facebook',
  'instagram',
  'other'
);

CREATE TYPE partner_relation_type AS ENUM (
  'parent_company',
  'child_contact',
  'billing_contact',
  'shipping_contact',
  'emergency_contact',
  'guardian',
  'owner',
  'other'
);

CREATE TYPE partner_activity_type AS ENUM (
  'note',
  'call',
  'meeting',
  'email',
  'task',
  'message'
);

CREATE TYPE partner_activity_status AS ENUM ('planned', 'done', 'cancelled');

-- =============================================================================
-- PARTNERS (Aggregate Root)
-- =============================================================================

CREATE TABLE partners (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                uuid NOT NULL,
  branch_id                 uuid NULL,

  -- Identity
  name                      varchar(255) NOT NULL,
  name_ar                   varchar(255) NULL,
  name_en                   varchar(255) NULL,
  display_name              varchar(255) NOT NULL,
  is_company                boolean NOT NULL DEFAULT false,
  status                    partner_status NOT NULL DEFAULT 'active',
  image_url                 text NULL,

  -- Roles (flags — not separate tables)
  is_customer               boolean NOT NULL DEFAULT false,
  is_vendor                 boolean NOT NULL DEFAULT false,
  is_employee               boolean NOT NULL DEFAULT false,
  is_internal               boolean NOT NULL DEFAULT false,

  -- Hierarchy
  parent_id                 uuid NULL REFERENCES partners(id),

  -- Primary contact (denormalized for list/search)
  email                     varchar(255) NULL,
  mobile                    varchar(64) NULL,
  phone                     varchar(64) NULL,
  website                   varchar(500) NULL,

  -- Business
  tax_number                varchar(64) NULL,
  commercial_registration   varchar(64) NULL,
  industry                  varchar(120) NULL,
  job_title                 varchar(120) NULL,
  department                varchar(120) NULL,
  language_code             varchar(16) NULL DEFAULT 'ar',
  currency_code             varchar(8) NULL DEFAULT 'SAR',
  timezone                  varchar(64) NULL,

  -- Financial
  payment_terms             varchar(120) NULL,
  credit_limit_amount       numeric(18, 4) NULL,
  credit_limit_currency     varchar(8) NULL,
  preferred_payment_method  varchar(64) NULL,

  -- Other
  notes                     text NULL,
  tags                      text[] NULL,
  ref_code                  varchar(64) NULL,

  -- Optional link to system user
  user_id                   uuid NULL,

  -- Soft archive + audit
  is_archived               boolean NOT NULL DEFAULT false,
  archived_at               timestamptz NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  created_by                varchar(255) NULL,
  updated_by                varchar(255) NULL,

  CONSTRAINT partners_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX idx_partners_company ON partners(company_id) WHERE is_archived = false;
CREATE INDEX idx_partners_company_branch ON partners(company_id, branch_id) WHERE is_archived = false;
CREATE INDEX idx_partners_parent ON partners(company_id, parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_partners_status ON partners(company_id, status);
CREATE INDEX idx_partners_roles ON partners(company_id, is_customer, is_vendor, is_employee);
CREATE INDEX idx_partners_email ON partners(company_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_partners_mobile ON partners(company_id, mobile) WHERE mobile IS NOT NULL;
CREATE INDEX idx_partners_tax ON partners(company_id, tax_number) WHERE tax_number IS NOT NULL;
CREATE INDEX idx_partners_display_name ON partners(company_id, display_name);
CREATE UNIQUE INDEX uq_partners_ref_per_company
  ON partners(company_id, ref_code) WHERE ref_code IS NOT NULL AND is_archived = false;

-- =============================================================================
-- ADDRESSES
-- =============================================================================

CREATE TABLE partner_addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  partner_id      uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  address_type    partner_address_type NOT NULL DEFAULT 'main',
  label           varchar(120) NULL,
  is_default      boolean NOT NULL DEFAULT false,
  country_code    varchar(8) NULL,
  state           varchar(120) NULL,
  city            varchar(120) NULL,
  district        varchar(120) NULL,
  street          varchar(255) NULL,
  building        varchar(120) NULL,
  postal_code     varchar(32) NULL,
  latitude        numeric(10, 7) NULL,
  longitude       numeric(10, 7) NULL,
  notes           text NULL,
  is_archived     boolean NOT NULL DEFAULT false,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      varchar(255) NULL,
  updated_by      varchar(255) NULL
);

CREATE INDEX idx_partner_addresses_partner ON partner_addresses(partner_id) WHERE is_archived = false;
CREATE INDEX idx_partner_addresses_company ON partner_addresses(company_id);
-- At most one default per (partner, address_type) among active rows
CREATE UNIQUE INDEX uq_partner_address_default
  ON partner_addresses(partner_id, address_type)
  WHERE is_default = true AND is_archived = false;

-- =============================================================================
-- CHANNELS (phones, emails, social, websites)
-- =============================================================================

CREATE TABLE partner_channels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  partner_id      uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  channel_type    partner_channel_type NOT NULL,
  value           varchar(500) NOT NULL,
  label           varchar(120) NULL,
  is_primary      boolean NOT NULL DEFAULT false,
  is_verified     boolean NOT NULL DEFAULT false,
  sort_order      int NOT NULL DEFAULT 0,
  is_archived     boolean NOT NULL DEFAULT false,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      varchar(255) NULL,
  updated_by      varchar(255) NULL
);

CREATE INDEX idx_partner_channels_partner ON partner_channels(partner_id) WHERE is_archived = false;
CREATE INDEX idx_partner_channels_value ON partner_channels(company_id, channel_type, lower(value));
CREATE UNIQUE INDEX uq_partner_channel_primary
  ON partner_channels(partner_id, channel_type)
  WHERE is_primary = true AND is_archived = false;

-- =============================================================================
-- NAMED RELATIONS (beyond parent_id)
-- =============================================================================

CREATE TABLE partner_relations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL,
  from_partner_id   uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  to_partner_id     uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  relation_type     partner_relation_type NOT NULL,
  notes             text NULL,
  is_archived       boolean NOT NULL DEFAULT false,
  archived_at       timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        varchar(255) NULL,
  updated_by        varchar(255) NULL,
  CONSTRAINT partner_relations_not_self CHECK (from_partner_id <> to_partner_id)
);

CREATE INDEX idx_partner_relations_from ON partner_relations(from_partner_id) WHERE is_archived = false;
CREATE INDEX idx_partner_relations_to ON partner_relations(to_partner_id) WHERE is_archived = false;
CREATE UNIQUE INDEX uq_partner_relation
  ON partner_relations(from_partner_id, to_partner_id, relation_type)
  WHERE is_archived = false;

-- =============================================================================
-- CATEGORIES + M2M
-- =============================================================================

CREATE TABLE partner_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  slug            varchar(80) NOT NULL,
  name_ar         varchar(120) NOT NULL,
  name_en         varchar(120) NULL,
  color           varchar(32) NULL,
  description     text NULL,
  is_active       boolean NOT NULL DEFAULT true,
  is_archived     boolean NOT NULL DEFAULT false,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      varchar(255) NULL,
  updated_by      varchar(255) NULL
);

CREATE UNIQUE INDEX uq_partner_categories_slug
  ON partner_categories(company_id, slug) WHERE is_archived = false;

CREATE TABLE partner_category_members (
  partner_id      uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES partner_categories(id) ON DELETE CASCADE,
  company_id      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      varchar(255) NULL,
  PRIMARY KEY (partner_id, category_id)
);

CREATE INDEX idx_partner_category_members_category ON partner_category_members(category_id);

-- =============================================================================
-- NOTES
-- =============================================================================

CREATE TABLE partner_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  partner_id      uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  body            text NOT NULL,
  is_pinned       boolean NOT NULL DEFAULT false,
  is_archived     boolean NOT NULL DEFAULT false,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      varchar(255) NULL,
  updated_by      varchar(255) NULL
);

CREATE INDEX idx_partner_notes_partner ON partner_notes(partner_id, created_at DESC);

-- =============================================================================
-- ATTACHMENTS
-- =============================================================================

CREATE TABLE partner_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  partner_id      uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  file_name       varchar(255) NOT NULL,
  file_url        text NOT NULL,
  mime_type       varchar(120) NULL,
  size_bytes      bigint NULL,
  label           varchar(120) NULL,
  is_archived     boolean NOT NULL DEFAULT false,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      varchar(255) NULL,
  updated_by      varchar(255) NULL
);

CREATE INDEX idx_partner_attachments_partner ON partner_attachments(partner_id) WHERE is_archived = false;

-- =============================================================================
-- ACTIVITIES / TIMELINE
-- =============================================================================

CREATE TABLE partner_activities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL,
  branch_id       uuid NULL,
  partner_id      uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  activity_type   partner_activity_type NOT NULL,
  status          partner_activity_status NOT NULL DEFAULT 'planned',
  subject         varchar(255) NOT NULL,
  body            text NULL,
  due_at          timestamptz NULL,
  completed_at    timestamptz NULL,
  assigned_to     varchar(255) NULL,
  is_archived     boolean NOT NULL DEFAULT false,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      varchar(255) NULL,
  updated_by      varchar(255) NULL
);

CREATE INDEX idx_partner_activities_partner ON partner_activities(partner_id, due_at);
CREATE INDEX idx_partner_activities_status ON partner_activities(company_id, status) WHERE is_archived = false;

-- =============================================================================
-- OPTIONAL: multi-company sharing (Phase 2+)
-- =============================================================================

-- CREATE TABLE partner_company_access (
--   partner_id   uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
--   company_id   uuid NOT NULL,
--   can_edit     boolean NOT NULL DEFAULT false,
--   created_at   timestamptz NOT NULL DEFAULT now(),
--   PRIMARY KEY (partner_id, company_id)
-- );
```

---

## قواعد تكامل الوحدات

أي جدول تشغيلي جديد يجب أن يستخدم:

```sql
partner_id uuid NULL REFERENCES partners(id)
```

بدل إنشاء `customers` / `vendors` / `contacts` منفصلة لنفس المعنى.

---

## Seed تصنيفات مقترحة (لكل شركة)

`vip`, `supplier`, `customer`, `government`, `employee`, `partner`, `prospect`, `distributor`
