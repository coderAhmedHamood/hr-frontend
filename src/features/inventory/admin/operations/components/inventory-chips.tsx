'use client';

import { MapPin, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils';

export type ProductQuantityChipLine = {
  id?: string;
  productName: string;
  quantity: number;
  sku?: string;
};

function chipTitle(line: ProductQuantityChipLine): string {
  const name = line.productName?.trim() || 'منتج';
  return `${name}${line.sku ? ` · ${line.sku}` : ''} × ${line.quantity}`;
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
      <span
        className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-foreground"
        dir="ltr"
      >
        ×{line.quantity}
      </span>
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
