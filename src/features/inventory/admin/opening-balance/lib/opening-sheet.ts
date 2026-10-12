import { downloadXlsxFromAoA } from '@/shared/export/download-xlsx';

/** One stock line read from the opening-balance sheet. */
export type OpeningSheetRow = {
  /** Spreadsheet row number as Excel shows it. */
  rowNumber: number;
  sku: string;
  nameAr: string;
  barcode: string;
  quantity: number;
  unitCost: number | null;
  salePrice: number | null;
  location: string;
};

export type OpeningSheetIssue = { rowNumber: number; message: string };

export type OpeningSheet = { rows: OpeningSheetRow[]; issues: OpeningSheetIssue[] };

const COLUMNS = {
  sku: ['رمز الصنف', 'sku', 'الرمز', 'كود'],
  nameAr: ['اسم الصنف', 'الاسم', 'name', 'اسم المنتج'],
  barcode: ['الباركود', 'barcode'],
  quantity: ['الكمية', 'quantity', 'qty'],
  unitCost: ['تكلفة الوحدة', 'التكلفة', 'cost', 'unit cost'],
  salePrice: ['سعر البيع', 'السعر', 'price'],
  location: ['الموقع', 'location'],
} as const;

type ColumnKey = keyof typeof COLUMNS;

const TEMPLATE_HEADER = [
  'رمز الصنف',
  'اسم الصنف',
  'الباركود',
  'الكمية',
  'تكلفة الوحدة',
  'سعر البيع',
  'الموقع',
];

const normalize = (value: unknown) =>
  String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * Reads a sheet number. Arabic-Indic and Persian digits, the Arabic decimal
 * separator «٫» and thousands separator «٬» are understood. A Latin comma
 * is accepted only as a thousands separator (1,250 or 1,250.5); anything
 * else («3,5») is ambiguous and returns NaN rather than a silent 35.
 */
export function parseSheetNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NaN;
  let text = String(value)
    .trim()
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/\u066B/g, '.')
    .replace(/\u066C/g, '')
    .replace(/[\s\u00A0]/g, '');
  if (text === '') return null;
  if (text.includes(',')) {
    if (!/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) return Number.NaN;
    text = text.replace(/,/g, '');
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return Number.NaN;
  return Number(text);
}

/** Codes and barcodes stay text: a numeric cell is written out in full, never as 6.28E+12. */
export function sheetText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 })
      : String(value);
  }
  return String(value).trim();
}

/** UTF-8 first; Arabic CSVs saved by older Excel are windows-1256. */
export function decodeCsv(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    return new TextDecoder('windows-1256').decode(bytes);
  }
}

export async function downloadOpeningSheetTemplate(): Promise<void> {
  await downloadXlsxFromAoA('قالب-الرصيد-الافتتاحي', 'الرصيد الافتتاحي', [
    TEMPLATE_HEADER,
    ['P-001', 'مثال: منظف أرضيات 1 لتر', '6281234567890', 24, 3.5, 5, ''],
  ]);
}

/**
 * Reads the sheet's rows. `firstRowNumber` is the spreadsheet row of
 * `table[0]` (the header), so error row numbers match what Excel shows
 * even with blank rows in between. A row needs a code, a name or a barcode,
 * and a quantity above zero.
 */
export function parseOpeningTable(sheetRows: unknown[][], firstRowNumber = 1): OpeningSheet {
  const headerAt = Math.max(
    0,
    sheetRows.findIndex((row) => (row ?? []).some((cell) => sheetText(cell) !== '')),
  );
  const table = sheetRows.slice(headerAt);
  firstRowNumber += headerAt;
  const header = (table[0] ?? []).map(normalize);
  const columnIndex = Object.fromEntries(
    (Object.keys(COLUMNS) as ColumnKey[]).map((key) => [
      key,
      header.findIndex((cell) => (COLUMNS[key] as readonly string[]).includes(cell)),
    ]),
  ) as Record<ColumnKey, number>;

  const issues: OpeningSheetIssue[] = [];
  if (
    columnIndex.quantity < 0 ||
    (columnIndex.sku < 0 && columnIndex.nameAr < 0 && columnIndex.barcode < 0)
  ) {
    issues.push({
      rowNumber: firstRowNumber,
      message:
        'الصف الأول يجب أن يحتوي على عمود «الكمية» وعمود «رمز الصنف» أو «اسم الصنف» أو «الباركود». نزّل القالب.',
    });
    return { rows: [], issues };
  }

  const raw = (row: unknown[], key: ColumnKey) =>
    columnIndex[key] >= 0 ? row[columnIndex[key]] : undefined;
  const text = (row: unknown[], key: ColumnKey) => sheetText(raw(row, key));

  const rows: OpeningSheetRow[] = [];
  table.slice(1).forEach((row, index) => {
    const rowNumber = firstRowNumber + index + 1;
    const sku = text(row ?? [], 'sku');
    const nameAr = text(row ?? [], 'nameAr');
    const barcode = text(row ?? [], 'barcode');
    if (!sku && !nameAr && !barcode) return;
    const label = sku || nameAr || barcode;

    const quantity = parseSheetNumber(raw(row, 'quantity'));
    const unitCost = parseSheetNumber(raw(row, 'unitCost'));
    const salePrice = parseSheetNumber(raw(row, 'salePrice'));
    if (quantity === null || Number.isNaN(quantity) || quantity <= 0) {
      issues.push({ rowNumber, message: `الكمية غير صحيحة (${label}).` });
      return;
    }
    if (Number.isNaN(unitCost) || (unitCost !== null && unitCost < 0)) {
      issues.push({ rowNumber, message: `تكلفة الوحدة غير صحيحة (${label}).` });
      return;
    }
    if (Number.isNaN(salePrice) || (salePrice !== null && salePrice < 0)) {
      issues.push({ rowNumber, message: `سعر البيع غير صحيح (${label}).` });
      return;
    }
    rows.push({
      rowNumber,
      sku,
      nameAr,
      barcode,
      quantity,
      unitCost,
      salePrice,
      location: text(row, 'location'),
    });
  });

  return { rows, issues };
}

/** Reads the first sheet of an .xlsx / .xls / .csv file. */
export async function parseOpeningSheet(file: File): Promise<OpeningSheet> {
  const XLSX = await import('xlsx');
  const bytes = new Uint8Array(await file.arrayBuffer());
  // CSV: decode ourselves (legacy codepages break Arabic) and keep every
  // field as text so codes like 00123 keep their zeros.
  const workbook = /\.csv$/i.test(file.name)
    ? XLSX.read(decodeCsv(bytes), { type: 'string', raw: true })
    : XLSX.read(bytes, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  if (!sheet) return { rows: [], issues: [{ rowNumber: 0, message: 'الملف لا يحتوي على أي ورقة.' }] };

  const firstRow = sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']).s.r + 1 : 1;
  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: true,
    defval: '',
    raw: true,
  });
  return parseOpeningTable(table, firstRow);
}
