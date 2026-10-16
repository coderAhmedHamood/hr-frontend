'use client';

import * as React from 'react';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { RegisterDocument, type RegisterColumn } from '@/components/pdf/print/register-document';
import { downloadXlsxFromAoA } from '@/shared/export/download-xlsx';

export type RegisterExportMenuProps = {
  /** Title of the printed register and the Excel sheet (e.g. «سجل السلف»). */
  title: string;
  /** File name without extension (e.g. `employee-advances`). */
  fileName: string;
  columns: RegisterColumn[];
  /**
   * The rows to export, one string per column — every record matching the
   * current filters, not only the visible page. May fetch (all pages).
   */
  getRows: () => string[][] | Promise<string[][]>;
  /** Lines under the title in the PDF (period, filters…). */
  subtitleLines?: string[];
  landscape?: boolean;
  emptyMessage?: string;
};

/**
 * The one export button of a list: PDF (the shared register layout, with
 * preview) and Excel, both from the same columns and rows.
 */
export function RegisterExportMenu({
  title,
  fileName,
  columns,
  getRows,
  subtitleLines,
  landscape,
  emptyMessage = 'لا توجد بيانات للتصدير ضمن الفلاتر الحالية.',
}: RegisterExportMenuProps) {
  const [busy, setBusy] = React.useState(false);
  const [pdfRows, setPdfRows] = React.useState<string[][] | null>(null);

  const loadRows = React.useCallback(async (): Promise<string[][] | null> => {
    setBusy(true);
    try {
      const rows = await getRows();
      if (rows.length === 0) {
        toast.error(emptyMessage);
        return null;
      }
      return rows;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر تجهيز بيانات التصدير');
      return null;
    } finally {
      setBusy(false);
    }
  }, [getRows, emptyMessage]);

  const exportPdf = React.useCallback(async () => {
    const rows = await loadRows();
    if (rows) setPdfRows(rows);
  }, [loadRows]);

  const exportExcel = React.useCallback(async () => {
    const rows = await loadRows();
    if (!rows) return;
    await downloadXlsxFromAoA(`${fileName}.xlsx`, title, [columns.map((c) => c.label), ...rows]);
    toast.success('تم تنزيل ملف Excel.');
  }, [loadRows, fileName, title, columns]);

  const printable = React.useMemo(
    () =>
      pdfRows ? (
        <RegisterDocument
          titleAr={title}
          subtitleLines={subtitleLines}
          columns={columns}
          rows={pdfRows}
          landscape={landscape}
        />
      ) : null,
    [pdfRows, title, subtitleLines, columns, landscape],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 shrink-0"
            aria-label={`تصدير ${title}`}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => void exportPdf()}>
            <FileDown className="h-4 w-4" />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void exportExcel()}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PdfPreviewExportDialog
        open={pdfRows !== null}
        onOpenChange={(open) => {
          if (!open) setPdfRows(null);
        }}
        title={`معاينة تصدير ${title}`}
        fileName={`${fileName}.pdf`}
        printable={printable}
        orientation={landscape ? 'landscape' : 'portrait'}
      />
    </>
  );
}
