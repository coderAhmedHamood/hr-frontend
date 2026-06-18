export type XlsxCell = string | number | boolean | null | undefined;

function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, '_').slice(0, 31) || 'Sheet1';
}

/** Write a single-sheet workbook and trigger browser download. */
export async function downloadXlsxFromAoA(
  fileName: string,
  sheetName: string,
  data: XlsxCell[][],
): Promise<void> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName(sheetName));
  const out = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, out);
}

/** Multi-sheet workbook (e.g. analytics: leaves + employees). */
export async function downloadXlsxMultiSheet(
  fileName: string,
  sheets: { name: string; data: XlsxCell[][] }[],
): Promise<void> {
  if (sheets.length === 0) return;
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const { name, data } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(name));
  }
  const out = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, out);
}
