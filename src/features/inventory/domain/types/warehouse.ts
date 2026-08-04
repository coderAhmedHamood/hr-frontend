import type { TenantScoped } from '@/features/ecommerce/domain/types/common';

export type WarehouseStatus = 'active' | 'inactive';

/** Incoming flow: 1 = receive+store, 2 = receive then store, 3 = receive + QC + store */
export type WarehouseIncomingSteps = 1 | 2 | 3;

/** Outgoing flow: 1 = deliver, 2 = pick+deliver, 3 = pick+pack+deliver */
export type WarehouseOutgoingSteps = 1 | 2 | 3;

export type WarehouseLocationType =
  | 'internal'
  | 'view'
  | 'supplier'
  | 'customer'
  | 'inventory'
  | 'production'
  | 'transit';

export type WarehouseRemovalStrategy = 'fifo' | 'lifo' | 'closest' | 'fewest_packages' | 'fefo';

export type Warehouse = TenantScoped & {
  id: string;
  /** Short code used for auto locations, e.g. فثسف or WH */
  code: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  address?: string;
  status: WarehouseStatus;
  incomingSteps: WarehouseIncomingSteps;
  outgoingSteps: WarehouseOutgoingSteps;
  buyToResupply: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseListQuery = {
  companyId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateWarehouseInput = Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export type WarehouseLocation = TenantScoped & {
  id: string;
  warehouseId: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  parentLocationId?: string | null;
  locationType: WarehouseLocationType;
  storageCategory?: string;
  barcode?: string;
  replenish: boolean;
  cycleCountFrequencyDays: number;
  lastCountAt?: string;
  nextCountAt?: string;
  removalStrategy: WarehouseRemovalStrategy;
  /** Legacy shelf fields — kept for display compatibility */
  aisle?: string;
  rack?: string;
  bin?: string;
  isActive: boolean;
  /** True when seeded automatically on warehouse create */
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseLocationListQuery = {
  companyId: string;
  /** When omitted, list locations across all warehouses. */
  warehouseId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateWarehouseLocationInput = Omit<WarehouseLocation, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseLocationInput = Partial<CreateWarehouseLocationInput>;

/** أنواع مستندات المخزون */
export type WarehouseOperationKind =
  | 'transfer'
  | 'receipt'
  | 'issue'
  | 'internal'
  | 'adjustment'
  | 'physical_count'
  | 'scrap'
  | 'purchase'
  | 'replenishment';

/** مسودة → جاهز → منتهي (+ ملغى) */
export type WarehouseOperationStatus = 'draft' | 'ready' | 'done' | 'cancelled';

export type WarehouseOperationLine = {
  id: string;
  productName: string;
  sku?: string;
  /** Required — every stock-affecting line must link to a catalog product. */
  productId: string;
  /** Links the line to a sellable variant when applicable. */
  variantId?: string;
  /** الكمية المطلوبة (الطلب) — وفي الجرد: الكمية النظرية */
  demandQuantity: number;
  /** الكمية المنفذة عند التصديق — وفي الجرد: الكمية المعدودة */
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  notes?: string;
};

export type WarehouseOperation = TenantScoped & {
  id: string;
  warehouseId: string;
  kind: WarehouseOperationKind;
  reference: string;
  status: WarehouseOperationStatus;
  occurredAt: string;
  notes?: string;
  /** شريك المصدر/الوجهة (اختياري) */
  partnerName?: string;
  /** المستند المصدر — مثل أمر شراء أو تجديد مخزون */
  sourceDocument?: string;
  /** مستودع الوجهة — للتحويلات بين المستودعات */
  destinationWarehouseId?: string;
  lines: WarehouseOperationLine[];
  createdAt: string;
  updatedAt: string;
};

export type WarehouseOperationListQuery = {
  companyId: string;
  /** When omitted, returns operations across warehouses (product-scoped lists). */
  warehouseId?: string;
  kind?: WarehouseOperationKind;
  status?: WarehouseOperationStatus;
  productId?: string;
  search?: string;
  /** Company-wide list for inventory reports (no warehouse/product/kind required). */
  all?: boolean;
  page?: number;
  limit?: number;
};

export type CreateWarehouseOperationInput = Omit<WarehouseOperation, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseOperationInput = Partial<CreateWarehouseOperationInput>;
