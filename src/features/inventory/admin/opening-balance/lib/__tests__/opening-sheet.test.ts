/**
 * @jest-environment node
 */
import { decodeCsv, parseOpeningTable, parseSheetNumber, sheetText } from '../opening-sheet';

describe('parseSheetNumber', () => {
  it('reads Arabic-Indic and Persian digits and the Arabic separators', () => {
    expect(parseSheetNumber('١٢٫٥')).toBe(12.5);
    expect(parseSheetNumber('۲۴')).toBe(24);
    expect(parseSheetNumber('١٬٢٥٠')).toBe(1250);
  });

  it('accepts a comma only as a thousands separator', () => {
    expect(parseSheetNumber('1,250')).toBe(1250);
    expect(parseSheetNumber('1,250.5')).toBe(1250.5);
    expect(parseSheetNumber('3,5')).toBeNaN();
    expect(parseSheetNumber('12,34,5')).toBeNaN();
  });

  it('treats empty as missing and garbage as invalid', () => {
    expect(parseSheetNumber('')).toBeNull();
    expect(parseSheetNumber(undefined)).toBeNull();
    expect(parseSheetNumber('abc')).toBeNaN();
    expect(parseSheetNumber(7)).toBe(7);
  });
});

describe('sheetText', () => {
  it('writes long numeric barcodes in full', () => {
    expect(sheetText(6281234567890)).toBe('6281234567890');
    expect(sheetText('00123')).toBe('00123');
  });
});

describe('decodeCsv', () => {
  it('decodes UTF-8 and drops the BOM', () => {
    const bytes = new TextEncoder().encode('\uFEFFالكمية');
    expect(decodeCsv(bytes)).toBe('الكمية');
  });

  it('falls back to windows-1256 for legacy Arabic CSV', () => {
    // «سكر» in windows-1256
    expect(decodeCsv(new Uint8Array([0xd3, 0xdf, 0xd1]))).toBe('سكر');
  });
});

describe('parseOpeningTable', () => {
  const header = ['رمز الصنف', 'اسم الصنف', 'الباركود', 'الكمية', 'تكلفة الوحدة'];

  it('numbers rows as Excel shows them, across blank rows and a late header', () => {
    const sheet = parseOpeningTable(
      [[], ['', '', '', '', ''], header, ['A', 'أ', '', 5, 2], ['', '', '', '', ''], ['B', 'ب', '', 'x', '']],
      1,
    );
    expect(sheet.rows).toHaveLength(1);
    expect(sheet.rows[0]).toMatchObject({ rowNumber: 4, sku: 'A', quantity: 5, unitCost: 2 });
    expect(sheet.issues).toEqual([{ rowNumber: 6, message: expect.stringContaining('الكمية') }]);
  });

  it('offsets row numbers when the used range starts lower', () => {
    const sheet = parseOpeningTable([header, ['A', '', '', 1, '']], 3);
    expect(sheet.rows[0]!.rowNumber).toBe(4);
  });

  it('accepts barcode-only rows and a barcode + quantity header', () => {
    const sheet = parseOpeningTable([['الباركود', 'الكمية'], [6281234567890, '٣']]);
    expect(sheet.issues).toEqual([]);
    expect(sheet.rows[0]).toMatchObject({ barcode: '6281234567890', quantity: 3, unitCost: null });
  });

  it('rejects a header without a quantity column', () => {
    const sheet = parseOpeningTable([['رمز الصنف'], ['A']]);
    expect(sheet.rows).toEqual([]);
    expect(sheet.issues[0]!.rowNumber).toBe(1);
  });

  it('rejects an ambiguous comma cost instead of reading 35', () => {
    const sheet = parseOpeningTable([header, ['A', '', '', 1, '3,5']]);
    expect(sheet.rows).toEqual([]);
    expect(sheet.issues[0]!.message).toContain('تكلفة');
  });
});
