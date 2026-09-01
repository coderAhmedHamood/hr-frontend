export const INVENTORY_SOURCE_KIND_LABELS: Record<string, string> = {
  inventory_low_stock: 'مخزون منخفض',
  inventory_out_of_stock: 'نفاد مخزون',
  inventory_negative_stock_blocked: 'رفض بدون رصيد',
  inventory_receipt_completed: 'ترحيل استلام',
  inventory_issue_completed: 'ترحيل صرف',
  inventory_transfer_completed: 'ترحيل تحويل بين مستودعات',
  inventory_adjustment_posted: 'تسوية مخزون',
  inventory_physical_count_completed: 'جرد فعلي',
  inventory_scrap_posted: 'إتلاف',
  inventory_operation_undone: 'تراجع عن ترحيل',
  inventory_sale_stock_deducted: 'خصم مخزون بيع',
};

export const INVENTORY_SEVERITY_DOT_CLASS: Record<string, string> = {
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-destructive',
};
