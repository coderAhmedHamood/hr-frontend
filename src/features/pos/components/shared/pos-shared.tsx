'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SettingsPageEmpty } from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { PrintDocumentView } from '@/features/print-templates/components/print-document-view';
import type { PrintableDocument } from '@/features/print-templates/domain/types';
import { printElement } from '@/features/print-templates/lib/print-html';
import { useDocumentPrintSettings } from '@/features/print-templates/lib/print-template-store';
import { SALE_STATUS_LABELS, type PosInvoiceStyle, type PosSaleStatus } from '@/features/pos/domain/types';
import { usePosContext, type PosPermission } from '@/features/pos/hooks/use-pos-context';

/** Shows the page only when POS is enabled for the company and the user may see it. */
export function PosGate({ permission, children }: { permission?: PosPermission; children: React.ReactNode }) {
  const { enabled, companyId, can } = usePosContext();
  if (!companyId) return <SettingsPageEmpty message="لا توجد شركة نشطة — اختر شركة." />;
  if (!enabled) return <SettingsPageEmpty message="تطبيق نقاط البيع غير مفعّل لهذه الشركة." />;
  if (permission && !can(permission)) return <SettingsPageEmpty message="ليس لديك صلاحية لهذه الصفحة." />;
  return <>{children}</>;
}

/** What POS does not do yet: its data is on the server, stock is not deducted. */
export function PosPreviewNote() {
  return (
    <div className="rounded-lg border border-dashed border-warning/40 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
      بيانات نقاط البيع محفوظة على الخادم وتظهر على كل الأجهزة. خصم المخزون من مبيعات نقاط البيع لم يُربط بعد؛ الأصناف والأسعار تُقرأ من تطبيق المنتجات.
    </div>
  );
}

export function SaleStatusBadge({ status }: { status: PosSaleStatus }) {
  const variant =
    status === 'completed' ? 'success' : status === 'cancelled' ? 'subtle' : status === 'payment_exception' ? 'destructive' : 'warning';
  return <Badge variant={variant}>{SALE_STATUS_LABELS[status]}</Badge>;
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

/** Preview + print with the company's chosen template. */
export function PrintPreviewDialog({
  open,
  onOpenChange,
  document,
  title,
  invoiceStyle = 'thermal',
  onPrinted,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PrintableDocument | null;
  title: string;
  /** Thermal ticket, or the company's normal A4 invoice. */
  invoiceStyle?: PosInvoiceStyle;
  onPrinted?: () => void;
  footer?: React.ReactNode;
}) {
  const { companyId, printCompany } = usePosContext();
  const thermal = useDocumentPrintSettings(companyId, 'pos_receipt');
  const standard = useDocumentPrintSettings(companyId, 'default');
  const settings = invoiceStyle === 'standard' ? standard : thermal;
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={settings.paper === 'a4' ? 'sm:max-w-4xl' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] justify-center overflow-auto rounded-md border border-border bg-muted/40 p-3">
          <div ref={ref} className={settings.paper === 'a4' ? 'origin-top scale-[0.62]' : undefined}>
            {document ? <PrintDocumentView document={document} company={printCompany} settings={settings} /> : null}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {footer}
          <Button
            type="button"
            onClick={() => {
              const el = ref.current?.firstElementChild as HTMLElement | null;
              if (el) printElement(el, settings.paper);
              onPrinted?.();
            }}
          >
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="text-sm font-semibold">{title}</div>
      {description ? <p className="max-w-md text-xs text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
