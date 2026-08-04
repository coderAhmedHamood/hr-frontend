import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';

/**
 * أنواع مستندات المخزون.
 * issue = التوصيلات (خروج للمبيعات/التسليم)
 *
 * uiPlacement:
 * - warehouse → تبويبات تفاصيل المستودع فقط
 * - header → قائمة التطبيق العامة فقط
 * - both → المستودع (خاص) + قائمة العمليات العامة
 *
 * العمليات اليومية (تحويل / إيصال / توصيل / داخلي) تظهر في المكانين:
 * عامة على مستوى التطبيق، وخاصة داخل المستودع.
 */
export const WAREHOUSE_OPERATION_KINDS: WarehouseOperationKind[] = [
  'transfer',
  'receipt',
  'issue',
  'internal',
  'adjustment',
  'physical_count',
  'scrap',
  'purchase',
  'replenishment',
];

export type WarehouseOperationUiPlacement = 'warehouse' | 'header' | 'both';

export type WarehouseOperationKindMeta = {
  labelAr: string;
  title: string;
  createLabel: string;
  empty: string;
  needsFrom: boolean;
  needsTo: boolean;
  needsDestWarehouse: boolean;
  refPrefix: string;
  stockEffect: 'inbound' | 'outbound' | 'move' | 'transfer' | 'adjust_set';
  uiPlacement: WarehouseOperationUiPlacement;
  /** مفتاح ترجمة اختياري */
  navLabelKey: string;
  /** مسار الصفحة العامة تحت /inventory/… */
  pathSegment: string;
};

export const WAREHOUSE_OPERATION_KIND_META: Record<WarehouseOperationKind, WarehouseOperationKindMeta> =
  {
    transfer: {
      labelAr: 'التحويلات',
      title: 'تحويلات بين المستودعات',
      createLabel: 'مستند تحويل',
      empty: 'لا توجد تحويلات بعد.',
      needsFrom: true,
      needsTo: true,
      needsDestWarehouse: true,
      refPrefix: 'WH/TR',
      stockEffect: 'transfer',
      uiPlacement: 'both',
      navLabelKey: 'opTransfers',
      pathSegment: 'transfers',
    },
    receipt: {
      labelAr: 'الإيصالات',
      title: 'الإيصالات',
      createLabel: 'مستند إيصال',
      empty: 'لا توجد إيصالات بعد.',
      needsFrom: false,
      needsTo: true,
      needsDestWarehouse: false,
      refPrefix: 'WH/IN',
      stockEffect: 'inbound',
      uiPlacement: 'both',
      navLabelKey: 'opReceipts',
      pathSegment: 'receipts',
    },
    issue: {
      labelAr: 'التوصيلات',
      title: 'التوصيلات',
      createLabel: 'مستند توصيل',
      empty: 'لا توجد توصيلات بعد.',
      needsFrom: true,
      needsTo: false,
      needsDestWarehouse: false,
      refPrefix: 'WH/OUT',
      stockEffect: 'outbound',
      uiPlacement: 'both',
      navLabelKey: 'opDeliveries',
      pathSegment: 'deliveries',
    },
    internal: {
      labelAr: 'داخلي',
      title: 'الحركات الداخلية',
      createLabel: 'حركة داخلية',
      empty: 'لا توجد حركات داخلية بعد.',
      needsFrom: true,
      needsTo: true,
      needsDestWarehouse: false,
      refPrefix: 'WH/INT',
      stockEffect: 'move',
      uiPlacement: 'both',
      navLabelKey: 'opInternal',
      pathSegment: 'internal',
    },
    adjustment: {
      labelAr: 'التعديلات',
      title: 'تعديلات المخزون',
      createLabel: 'مستند تعديل',
      empty: 'لا توجد تعديلات بعد.',
      needsFrom: false,
      needsTo: true,
      needsDestWarehouse: false,
      refPrefix: 'WH/ADJ',
      stockEffect: 'adjust_set',
      uiPlacement: 'both',
      navLabelKey: 'opAdjustments',
      pathSegment: 'adjustments',
    },
    physical_count: {
      labelAr: 'الجرد المادي',
      title: 'الجرد المادي',
      createLabel: 'مستند جرد',
      empty: 'لا توجد عمليات جرد بعد.',
      needsFrom: false,
      needsTo: true,
      needsDestWarehouse: false,
      refPrefix: 'WH/INV',
      stockEffect: 'adjust_set',
      uiPlacement: 'both',
      navLabelKey: 'opPhysicalCount',
      pathSegment: 'physical-counts',
    },
    scrap: {
      labelAr: 'مخلفات التصنيع',
      title: 'مخلفات التصنيع',
      createLabel: 'مستند مخلفات',
      empty: 'لا توجد مخلفات مسجّلة بعد.',
      needsFrom: true,
      needsTo: false,
      needsDestWarehouse: false,
      refPrefix: 'WH/SCR',
      stockEffect: 'outbound',
      uiPlacement: 'both',
      navLabelKey: 'opScrap',
      pathSegment: 'scrap',
    },
    purchase: {
      labelAr: 'الشراء',
      title: 'استلامات الشراء',
      createLabel: 'مستند شراء',
      empty: 'لا توجد استلامات شراء بعد.',
      needsFrom: false,
      needsTo: true,
      needsDestWarehouse: false,
      refPrefix: 'WH/PO',
      stockEffect: 'inbound',
      uiPlacement: 'header',
      navLabelKey: 'opPurchase',
      pathSegment: 'purchases',
    },
    replenishment: {
      labelAr: 'تجديد المخزون',
      title: 'تجديد المخزون',
      createLabel: 'طلب تجديد',
      empty: 'لا توجد طلبات تجديد بعد.',
      needsFrom: false,
      needsTo: true,
      needsDestWarehouse: false,
      refPrefix: 'WH/RPL',
      stockEffect: 'inbound',
      uiPlacement: 'header',
      navLabelKey: 'opReplenishment',
      pathSegment: 'replenishment',
    },
  };

export function isWarehouseOperationKind(value: string | null | undefined): value is WarehouseOperationKind {
  return Boolean(value && (WAREHOUSE_OPERATION_KINDS as string[]).includes(value));
}

/** تبويبات داخل صفحة المستودع — عمليات خاصة بهذا المستودع */
export const WAREHOUSE_DETAIL_TAB_KINDS: WarehouseOperationKind[] = WAREHOUSE_OPERATION_KINDS.filter(
  (kind) => {
    const placement = WAREHOUSE_OPERATION_KIND_META[kind].uiPlacement;
    return placement === 'warehouse' || placement === 'both';
  },
);

/** قائمة العمليات العامة في تطبيق المخزون */
export const INVENTORY_HEADER_OPERATION_KINDS: WarehouseOperationKind[] = WAREHOUSE_OPERATION_KINDS.filter(
  (kind) => {
    const placement = WAREHOUSE_OPERATION_KIND_META[kind].uiPlacement;
    return placement === 'header' || placement === 'both';
  },
);

export function warehouseOperationKindFromPathSegment(
  segment: string | null | undefined,
): WarehouseOperationKind | null {
  if (!segment) return null;
  for (const kind of WAREHOUSE_OPERATION_KINDS) {
    if (WAREHOUSE_OPERATION_KIND_META[kind].pathSegment === segment) return kind;
  }
  return null;
}
