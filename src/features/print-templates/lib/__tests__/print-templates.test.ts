import {
  DEFAULT_PRINT_TEMPLATE_SETTINGS,
  type PrintTemplateSettings,
} from '@/features/print-templates/domain/types';
import { resolveDocumentPrintSettings } from '@/features/print-templates/lib/print-template-store';
import {
  buildOperationPrintDocument,
  operationPrintDocumentType,
} from '@/features/inventory/admin/operations/lib/operation-print-document';
import type { WarehouseOperation } from '@/features/inventory/domain/types/warehouse';

const unified: PrintTemplateSettings = { ...DEFAULT_PRINT_TEMPLATE_SETTINGS, templateId: 'modern', paper: '80mm' };
const ownReceipt: PrintTemplateSettings = { ...DEFAULT_PRINT_TEMPLATE_SETTINGS, templateId: 'formal', paper: 'a4' };

describe('which template a document prints with', () => {
  it('its own template, else the unified one, else its starting point', () => {
    expect(resolveDocumentPrintSettings({ default: unified, inventory_receipt: ownReceipt }, 'inventory_receipt').templateId).toBe('formal');
    expect(resolveDocumentPrintSettings({ default: unified }, 'inventory_receipt').templateId).toBe('modern');
    // Nothing saved: inventory documents start formal on A4, POS classic on 80 mm.
    expect(resolveDocumentPrintSettings({}, 'inventory_delivery')).toMatchObject({ templateId: 'formal', paper: 'a4' });
    expect(resolveDocumentPrintSettings(undefined, 'pos_receipt')).toMatchObject({ templateId: 'classic', paper: '80mm' });
  });
});

describe('inventory documents', () => {
  const operation = {
    id: 'op1',
    companyId: 'c1',
    warehouseId: 'w1',
    kind: 'receipt',
    reference: 'WH/IN/00042',
    status: 'done',
    occurredAt: '2026-10-09T10:15:00',
    partnerName: 'شركة التوريدات',
    lines: [],
    createdAt: '',
    updatedAt: '',
  } as unknown as WarehouseOperation;

  it('maps kinds to receipt / delivery / transfer', () => {
    expect(operationPrintDocumentType('receipt')).toBe('inventory_receipt');
    expect(operationPrintDocumentType('purchase')).toBe('inventory_receipt');
    expect(operationPrintDocumentType('issue')).toBe('inventory_delivery');
    expect(operationPrintDocumentType('scrap')).toBe('inventory_delivery');
    expect(operationPrintDocumentType('transfer')).toBe('inventory_transfer');
  });

  it('builds a stock document: quantities, locations, signatures, no prices', () => {
    const doc = buildOperationPrintDocument({
      operation,
      lines: [
        { id: 'l1', productId: 'p1', productName: 'قميص', sku: 'SH-1', demandQuantity: 5, quantity: 4, toLocationId: 'loc1' },
        { id: 'l2', productId: 'p2', productName: 'حزام', demandQuantity: 2, quantity: 2, toLocationId: 'loc2' },
      ],
      warehouseName: 'المستودع الرئيسي',
      destinationWarehouseName: null,
      locationName: (id) => (id === 'loc1' ? 'A-01' : 'A-02'),
    });
    expect(doc.title).toBe('سند استلام');
    expect(doc.columns).toBe('stock');
    expect(doc.lines.map((l) => [l.name, l.quantity, l.location])).toEqual([
      ['قميص', 4, 'A-01'],
      ['حزام', 2, 'A-02'],
    ]);
    expect(doc.lines[0]).not.toHaveProperty('unitPrice');
    expect(doc.totals.at(-1)).toMatchObject({ label: 'إجمالي الكميات', value: '6' });
    expect(doc.meta).toContainEqual({ label: 'المورد / المسلِّم', value: 'شركة التوريدات' });
    expect(doc.signatures).toContain('أمين المخزن');
    expect(doc.copyLabel).toBeUndefined();
  });

  it('a document not done yet says so', () => {
    const doc = buildOperationPrintDocument({
      operation: { ...operation, status: 'draft' },
      lines: [{ id: 'l1', productId: 'p1', productName: 'قميص', demandQuantity: 5, quantity: 0 }],
      warehouseName: 'المستودع',
      destinationWarehouseName: null,
      locationName: () => '',
    });
    expect(doc.lines[0].quantity).toBe(5);
    expect(doc.copyLabel).toContain('مسودة');
  });
});
