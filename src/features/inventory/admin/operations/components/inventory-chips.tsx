'use client';

import { MapPin, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils';

export type ProductQuantityChipLine = {
  id?: string;
  productName: string;
  quantity: number;
  /** Requested amount, when it can differ from `quantity` (issued/received). */
  demandQuantity?: number;
  sku?: string;
};

function hasQuantityGap(line: ProductQuantityChipLine): boolean {
  return line.demandQuantity != null && Math.abs(line.demandQuantity - line.quantity) > 1e-9;
}

function chipTitle(line: ProductQuantityChipLine): string {
  const name = line.productName?.trim() || 'منتج';
  const base = `${name}${line.sku ? ` · ${line.sku}` : ''}`;
  if (hasQuantityGap(line)) {
    return `${base} · المطلوب ${line.demandQuantity} · المنفَّذ ${line.quantity}`;
  }
  return `${base} × ${line.quantity}`;
}

/** Callers often pass an already-formatted placeholder instead of an empty value. */
function chipName(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return null;
  return trimmed;
}

function EmptyChipValue() {
  return <span className="text-sm text-muted-foreground">—</span>;
}

/** Product name and its quantity in one chip so both always read together. */
export function ProductQuantityChip({
  line,
  className,
}: {
  line: ProductQuantityChipLine;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('max-w-[230px] gap-1.5 py-1 font-normal', className)}
      title={chipTitle(line)}
    >
      <span className="truncate">{line.productName?.trim() || 'منتج'}</span>
      {hasQuantityGap(line) ? (
        <span className="flex shrink-0 items-center gap-1" dir="ltr">
          <span className="rounded-full bg-muted px-1.5 text-[11px] font-normal tabular-nums text-muted-foreground line-through">
            {line.demandQuantity}
          </span>
          <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-foreground">
            ×{line.quantity}
          </span>
        </span>
      ) : (
        <span
          className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-foreground"
          dir="ltr"
        >
          ×{line.quantity}
        </span>
      )}
    </Badge>
  );
}

/** Document lines as chips, with a `+N` chip when the list is long. */
export function ProductQuantityChips({
  lines,
  maxVisible = 3,
  className,
}: {
  lines: ProductQuantityChipLine[];
  maxVisible?: number;
  className?: string;
}) {
  if (lines.length === 0) return <EmptyChipValue />;

  const visible = lines.slice(0, maxVisible);
  const hidden = lines.slice(maxVisible);

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map((line, index) => (
        <ProductQuantityChip key={line.id ?? `${line.productName}-${index}`} line={line} />
      ))}
      {hidden.length > 0 ? (
        <Badge
          variant="subtle"
          className="py-1 font-normal tabular-nums"
          title={hidden.map(chipTitle).join('\n')}
        >
          +{hidden.length}
        </Badge>
      ) : null}
    </div>
  );
}

export function WarehouseChip({ name, className }: { name?: string | null; className?: string }) {
  const label = chipName(name);
  if (!label) return <EmptyChipValue />;
  return (
    <Badge variant="subtle" className={cn('max-w-[200px] py-1 font-normal', className)} title={label}>
      <Warehouse aria-hidden className="h-3 w-3 shrink-0" />
      <span className="truncate">{label}</span>
    </Badge>
  );
}

/** Source → destination warehouses, for cross-warehouse transfer rows. */
export function WarehouseRouteChips({
  from,
  to,
  className,
}: {
  from?: string | null;
  to?: string | null;
  className?: string;
}) {
  const fromName = chipName(from);
  const toName = chipName(to);
  if (!fromName || !toName) return <WarehouseChip name={fromName ?? toName} className={className} />;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <WarehouseChip name={fromName} />
      <span aria-hidden className="text-xs text-muted-foreground">
        ←
      </span>
      <WarehouseChip name={toName} />
    </div>
  );
}

export function LocationChip({
  name,
  label,
  className,
}: {
  name?: string | null;
  label?: string;
  className?: string;
}) {
  const value = chipName(name);
  if (!value) return <EmptyChipValue />;
  return (
    <Badge
      variant="outline"
      className={cn('max-w-[200px] py-1 font-normal', className)}
      title={label ? `${label}: ${value}` : value}
    >
      <MapPin aria-hidden className="h-3 w-3 shrink-0" />
      <span className="truncate">{value}</span>
    </Badge>
  );
}

/** Source → destination locations, kept side by side with a flow arrow. */
export function LocationRouteChips({
  from,
  to,
  className,
}: {
  from?: string | null;
  to?: string | null;
  className?: string;
}) {
  const fromName = chipName(from);
  const toName = chipName(to);
  if (!fromName && !toName) return <EmptyChipValue />;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {fromName ? <LocationChip name={fromName} label="من" /> : null}
      {fromName && toName ? (
        <span aria-hidden className="text-xs text-muted-foreground">
          ←
        </span>
      ) : null}
      {toName ? <LocationChip name={toName} label="إلى" /> : null}
    </div>
  );
}

/**
 * Requested vs executed quantity. Collapses to a single chip while they match,
 * so the split only shows up on documents that were partially fulfilled.
 */
export function DemandActualChips({
  demand,
  actual,
  actualLabel = 'المنفَّذ',
  tone = 'neutral',
  className,
}: {
  demand?: number | null;
  actual: number;
  actualLabel?: string;
  tone?: 'neutral' | 'in' | 'out';
  className?: string;
}) {
  const gap = demand != null && Math.abs(demand - actual) > 1e-9;
  if (!gap) return <QuantityChip value={actual} tone={tone} className={className} />;

  const shortfall = (demand ?? 0) - actual;
  return (
    <div
      className={cn('flex flex-col items-start gap-1', className)}
      title={`المطلوب ${demand} · ${actualLabel} ${actual}`}
    >
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        المطلوب
        <QuantityChip value={demand ?? 0} className="py-0 text-[11px]" />
      </span>
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {actualLabel}
        <QuantityChip value={actual} tone={tone} className="py-0 text-[11px]" />
      </span>
      <span
        className={cn(
          'text-[11px] font-medium tabular-nums',
          shortfall > 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400',
        )}
        dir="ltr"
      >
        {shortfall > 0 ? `-${shortfall}` : `+${Math.abs(shortfall)}`}
      </span>
    </div>
  );
}

/** Bare quantity chip for tables where the product sits in its own column. */
export function QuantityChip({
  value,
  tone = 'neutral',
  className,
}: {
  value: number | string;
  tone?: 'neutral' | 'in' | 'out';
  className?: string;
}) {
  return (
    <Badge
      variant={tone === 'in' ? 'success' : tone === 'out' ? 'destructive' : 'subtle'}
      className={cn('py-1 font-semibold tabular-nums', className)}
      dir="ltr"
    >
      {value}
    </Badge>
  );
}
