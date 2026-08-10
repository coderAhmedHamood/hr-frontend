# inventory

```sql
-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE warehouse_status AS ENUM ('active', 'inactive');

CREATE TYPE warehouse_location_type AS ENUM (
  'internal',
  'view',
  'supplier',
  'customer',
  'inventory',
  'production',
  'transit'
);

CREATE TYPE warehouse_removal_strategy AS ENUM (
  'fifo',
  'lifo',
  'closest',
  'fewest_packages',
  'fefo'
);

CREATE TYPE warehouse_operation_kind AS ENUM (
  'transfer',
  'receipt',
  'issue',
  'internal',
  'adjustment',
  'physical_count',
  'scrap',
  'purchase',
  'replenishment'
);

CREATE TYPE warehouse_operation_status AS ENUM (
  'draft',
  'ready',
  'done',
  'cancelled'
);

CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');

CREATE TYPE stock_status AS ENUM (
  'in_stock',
  'out_of_stock',
  'preorder',
  'discontinued'
);

CREATE TYPE product_type AS ENUM ('goods', 'service', 'combo');

CREATE TYPE product_tracking AS ENUM ('none', 'lot', 'serial');

CREATE TYPE product_invoice_policy AS ENUM ('ordered', 'delivered');

CREATE TYPE packaging_type AS ENUM ('unit', 'pack', 'box', 'pallet', 'other');

CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TYPE attribute_display_type AS ENUM (
  'radio',
  'pills',
  'select',
  'color',
  'image',
  'multi'
);

CREATE TYPE variant_creation_mode AS ENUM ('always', 'dynamic', 'never');

CREATE TYPE putaway_applies_to AS ENUM ('product', 'category', 'all');

CREATE TYPE category_package_reservation AS ENUM ('full', 'partial');

-- =============================================================================
-- ORGANIZATION (Company ↔ Branch) — مرجع الربط الأساسي
-- الجداول موجودة مسبقًا؛ تُنشأ هنا فقط إن لم تكن موجودة
-- =============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NULL,
  commercial_registration_no TEXT NULL,
  tax_number TEXT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  mobile TEXT NULL,
  website TEXT NULL,
  country TEXT NULL,
  city TEXT NULL,
  district TEXT NULL,
  address TEXT NULL,
  postal_code TEXT NULL,
  logo_url TEXT NULL,
  primary_color TEXT NULL,
  secondary_color TEXT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  currency_code TEXT NOT NULL DEFAULT 'SAR',
  language_code TEXT NOT NULL DEFAULT 'ar',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL,
  UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  mobile TEXT NULL,
  city TEXT NULL,
  district TEXT NULL,
  address TEXT NULL,
  postal_code TEXT NULL,
  latitude TEXT NULL,
  longitude TEXT NULL,
  manager_name TEXT NULL,
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL,
  UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);

-- =============================================================================
-- CATALOG — Brands
-- =============================================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NULL,
  description TEXT NULL,
  logo_url TEXT NULL,
  logo_alt TEXT NULL,
  website_url TEXT NULL,
  seo_meta_title TEXT NULL,
  seo_meta_description TEXT NULL,
  seo_canonical_path TEXT NULL,
  seo_og_image TEXT NULL,
  seo_keywords TEXT[] NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

CREATE INDEX idx_brands_company_id ON brands(company_id);

-- =============================================================================
-- CATALOG — Categories
-- =============================================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  image_alt TEXT NULL,
  featured_brand_ids UUID[] NULL,
  seo_meta_title TEXT NULL,
  seo_meta_description TEXT NULL,
  seo_canonical_path TEXT NULL,
  seo_og_image TEXT NULL,
  seo_keywords TEXT[] NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  logistics_routes_note TEXT NULL,
  logistics_removal_strategy warehouse_removal_strategy NULL,
  logistics_package_reservation category_package_reservation NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

CREATE INDEX idx_categories_company_id ON categories(company_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- =============================================================================
-- CATALOG — Attributes
-- =============================================================================

CREATE TABLE catalog_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  display_type attribute_display_type NOT NULL DEFAULT 'select',
  create_variant variant_creation_mode NOT NULL DEFAULT 'always',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_attributes_company_id ON catalog_attributes(company_id);

CREATE TABLE catalog_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES catalog_attributes(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  free_text TEXT NULL,
  default_extra_price NUMERIC(14, 4) NULL,
  color_hex TEXT NULL,
  image_url TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_attribute_values_attribute_id ON catalog_attribute_values(attribute_id);

-- =============================================================================
-- CATALOG — Products
-- =============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brand_id UUID NULL REFERENCES brands(id) ON DELETE SET NULL,
  category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  slug TEXT NOT NULL,
  barcode TEXT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NULL,
  description TEXT NULL,
  short_description TEXT NULL,
  status product_status NOT NULL DEFAULT 'draft',
  stock_status stock_status NOT NULL DEFAULT 'in_stock',
  product_type product_type NOT NULL DEFAULT 'goods',
  tracking product_tracking NOT NULL DEFAULT 'none',
  invoice_policy product_invoice_policy NOT NULL DEFAULT 'ordered',
  price_amount NUMERIC(14, 4) NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'SAR',
  cost_price_amount NUMERIC(14, 4) NULL,
  cost_price_currency TEXT NULL,
  compare_at_price_amount NUMERIC(14, 4) NULL,
  compare_at_price_currency TEXT NULL,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  quantity_cache NUMERIC(18, 4) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(18, 4) NOT NULL DEFAULT 5,
  allow_backorder BOOLEAN NOT NULL DEFAULT false,
  weight_kg NUMERIC(12, 4) NULL,
  length_cm NUMERIC(12, 4) NULL,
  width_cm NUMERIC(12, 4) NULL,
  height_cm NUMERIC(12, 4) NULL,
  pos_available BOOLEAN NOT NULL DEFAULT false,
  sale_ok BOOLEAN NOT NULL DEFAULT true,
  purchase_ok BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] NULL,
  seo_meta_title TEXT NULL,
  seo_meta_description TEXT NULL,
  seo_canonical_path TEXT NULL,
  seo_og_image TEXT NULL,
  seo_keywords TEXT[] NULL,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku),
  UNIQUE (company_id, slug)
);

CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(company_id, status);
CREATE INDEX idx_products_barcode ON products(company_id, barcode) WHERE barcode IS NOT NULL;

CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  type media_type NOT NULL DEFAULT 'image',
  position INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  width INTEGER NULL,
  height INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_media_product_id ON product_media(product_id);

CREATE TABLE product_uom_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  unece_code TEXT NULL,
  relative_quantity NUMERIC(18, 6) NOT NULL DEFAULT 1,
  is_reference BOOLEAN NOT NULL DEFAULT false,
  packaging_type packaging_type NOT NULL DEFAULT 'unit',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_uom_lines_product_id ON product_uom_lines(product_id);

CREATE TABLE product_attribute_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  catalog_attribute_id UUID NULL REFERENCES catalog_attributes(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  display_type attribute_display_type NOT NULL DEFAULT 'select',
  create_variant variant_creation_mode NOT NULL DEFAULT 'always',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_attribute_lines_product_id ON product_attribute_lines(product_id);

CREATE TABLE product_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_attribute_line_id UUID NOT NULL REFERENCES product_attribute_lines(id) ON DELETE CASCADE,
  catalog_attribute_value_id UUID NULL REFERENCES catalog_attribute_values(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  free_text TEXT NULL,
  default_extra_price NUMERIC(14, 4) NULL,
  color_hex TEXT NULL,
  image_url TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_attribute_values_line_id ON product_attribute_values(product_attribute_line_id);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  combination_key TEXT NOT NULL,
  sku TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  barcode TEXT NULL,
  image_url TEXT NULL,
  sale_price_amount NUMERIC(14, 4) NOT NULL DEFAULT 0,
  sale_price_currency TEXT NOT NULL DEFAULT 'SAR',
  cost_price_amount NUMERIC(14, 4) NOT NULL DEFAULT 0,
  cost_price_currency TEXT NOT NULL DEFAULT 'SAR',
  quantity_cache NUMERIC(18, 4) NOT NULL DEFAULT 0,
  stock_status stock_status NOT NULL DEFAULT 'in_stock',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, combination_key),
  UNIQUE (product_id, sku)
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

CREATE TABLE product_variant_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  product_attribute_value_id UUID NOT NULL REFERENCES product_attribute_values(id) ON DELETE CASCADE,
  attribute_name_ar TEXT NOT NULL,
  value_name_ar TEXT NOT NULL,
  color_hex TEXT NULL,
  UNIQUE (variant_id, product_attribute_value_id)
);

CREATE INDEX idx_product_variant_attr_values_variant_id ON product_variant_attribute_values(variant_id);

-- =============================================================================
-- WAREHOUSES & LOCATIONS
-- =============================================================================

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NULL REFERENCES branches(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NULL,
  description TEXT NULL,
  address TEXT NULL,
  status warehouse_status NOT NULL DEFAULT 'active',
  incoming_steps SMALLINT NOT NULL DEFAULT 1 CHECK (incoming_steps BETWEEN 1 AND 3),
  outgoing_steps SMALLINT NOT NULL DEFAULT 1 CHECK (outgoing_steps BETWEEN 1 AND 3),
  buy_to_resupply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE INDEX idx_warehouses_company_id ON warehouses(company_id);
CREATE INDEX idx_warehouses_branch_id ON warehouses(branch_id);

CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  parent_location_id UUID NULL REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NULL,
  location_type warehouse_location_type NOT NULL DEFAULT 'internal',
  storage_category TEXT NULL,
  barcode TEXT NULL,
  replenish BOOLEAN NOT NULL DEFAULT false,
  cycle_count_frequency_days INTEGER NOT NULL DEFAULT 0,
  last_count_at TIMESTAMPTZ NULL,
  next_count_at TIMESTAMPTZ NULL,
  removal_strategy warehouse_removal_strategy NOT NULL DEFAULT 'fifo',
  aisle TEXT NULL,
  rack TEXT NULL,
  bin TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, code)
);

CREATE INDEX idx_warehouse_locations_company_id ON warehouse_locations(company_id);
CREATE INDEX idx_warehouse_locations_warehouse_id ON warehouse_locations(warehouse_id);
CREATE INDEX idx_warehouse_locations_parent_id ON warehouse_locations(parent_location_id);
CREATE INDEX idx_warehouse_locations_type ON warehouse_locations(warehouse_id, location_type);

-- =============================================================================
-- STOCK BALANCES
-- =============================================================================

CREATE TABLE location_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES warehouse_locations(id) ON DELETE CASCADE,
  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT location_stock_quantity_non_negative CHECK (quantity >= 0),
  CONSTRAINT location_stock_reserved_non_negative CHECK (reserved_quantity >= 0),
  CONSTRAINT location_stock_unique_product_location UNIQUE NULLS NOT DISTINCT (
    company_id,
    product_id,
    variant_id,
    warehouse_id,
    location_id
  )
);

CREATE INDEX idx_location_stock_company_id ON location_stock(company_id);
CREATE INDEX idx_location_stock_product_id ON location_stock(product_id);
CREATE INDEX idx_location_stock_variant_id ON location_stock(variant_id);
CREATE INDEX idx_location_stock_warehouse_id ON location_stock(warehouse_id);
CREATE INDEX idx_location_stock_location_id ON location_stock(location_id);

-- =============================================================================
-- WAREHOUSE OPERATIONS (Documents)
-- =============================================================================

CREATE TABLE warehouse_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  destination_warehouse_id UUID NULL REFERENCES warehouses(id) ON DELETE SET NULL,
  kind warehouse_operation_kind NOT NULL,
  reference TEXT NOT NULL,
  status warehouse_operation_status NOT NULL DEFAULT 'draft',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT NULL,
  partner_name TEXT NULL,
  source_document TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, reference)
);

CREATE INDEX idx_warehouse_operations_company_id ON warehouse_operations(company_id);
CREATE INDEX idx_warehouse_operations_warehouse_id ON warehouse_operations(warehouse_id);
CREATE INDEX idx_warehouse_operations_kind ON warehouse_operations(company_id, kind);
CREATE INDEX idx_warehouse_operations_status ON warehouse_operations(company_id, status);
CREATE INDEX idx_warehouse_operations_occurred_at ON warehouse_operations(occurred_at);

CREATE TABLE warehouse_operation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES warehouse_operations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NULL,
  demand_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  from_location_id UUID NULL REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  to_location_id UUID NULL REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  notes TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warehouse_operation_lines_operation_id ON warehouse_operation_lines(operation_id);
CREATE INDEX idx_warehouse_operation_lines_product_id ON warehouse_operation_lines(product_id);
CREATE INDEX idx_warehouse_operation_lines_variant_id ON warehouse_operation_lines(variant_id);

-- =============================================================================
-- INVENTORY LEDGER (immutable history)
-- =============================================================================

CREATE TABLE inventory_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  operation_id UUID NOT NULL REFERENCES warehouse_operations(id) ON DELETE RESTRICT,
  operation_line_id UUID NOT NULL REFERENCES warehouse_operation_lines(id) ON DELETE RESTRICT,
  operation_reference TEXT NOT NULL,
  kind warehouse_operation_kind NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  sku TEXT NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES warehouse_locations(id) ON DELETE RESTRICT,
  quantity_delta NUMERIC(18, 4) NOT NULL,
  counterpart_location_id UUID NULL REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  counterpart_warehouse_id UUID NULL REFERENCES warehouses(id) ON DELETE SET NULL,
  source_document TEXT NULL,
  partner_name TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_ledger_company_id ON inventory_ledger_entries(company_id);
CREATE INDEX idx_inventory_ledger_operation_id ON inventory_ledger_entries(operation_id);
CREATE INDEX idx_inventory_ledger_product_id ON inventory_ledger_entries(product_id);
CREATE INDEX idx_inventory_ledger_warehouse_id ON inventory_ledger_entries(warehouse_id);
CREATE INDEX idx_inventory_ledger_location_id ON inventory_ledger_entries(location_id);
CREATE INDEX idx_inventory_ledger_occurred_at ON inventory_ledger_entries(occurred_at);
CREATE INDEX idx_inventory_ledger_kind ON inventory_ledger_entries(company_id, kind);

-- =============================================================================
-- PUTAWAY RULES
-- =============================================================================

CREATE TABLE putaway_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  arrive_location_id UUID NOT NULL REFERENCES warehouse_locations(id) ON DELETE RESTRICT,
  applies_to putaway_applies_to NOT NULL DEFAULT 'all',
  product_id UUID NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NULL REFERENCES categories(id) ON DELETE CASCADE,
  packaging_type packaging_type NULL,
  store_location_id UUID NOT NULL REFERENCES warehouse_locations(id) ON DELETE RESTRICT,
  sub_location_id UUID NULL REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  sequence INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT putaway_rules_applies_product CHECK (
    applies_to <> 'product' OR product_id IS NOT NULL
  ),
  CONSTRAINT putaway_rules_applies_category CHECK (
    applies_to <> 'category' OR category_id IS NOT NULL
  )
);

CREATE INDEX idx_putaway_rules_company_id ON putaway_rules(company_id);
CREATE INDEX idx_putaway_rules_warehouse_id ON putaway_rules(warehouse_id);
CREATE INDEX idx_putaway_rules_product_id ON putaway_rules(product_id);
CREATE INDEX idx_putaway_rules_category_id ON putaway_rules(category_id);
CREATE INDEX idx_putaway_rules_active ON putaway_rules(warehouse_id, is_active, sequence);
```
