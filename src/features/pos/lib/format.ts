/**
 * Money display. The currency comes from the company (its settings own it);
 * POS never writes a country or currency of its own.
 */
const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatAmount(value: number): string {
  return numberFormat.format(Number.isFinite(value) ? value : 0);
}

export function formatMoney(value: number, currencyCode?: string | null): string {
  const amount = formatAmount(value);
  return currencyCode ? `${amount} ${currencyCode}` : amount;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses a typed amount ("1,250.5" → 1250.5); NaN-safe. */
export function parseAmount(text: string): number {
  const n = Number(String(text).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}
