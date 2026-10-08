/**
 * Money in minor units (integers): 1 YER = 100, 1 KWD = 1000, 1 JPY = 1.
 * Every amount stored or computed by the expenses app is an integer number of
 * minor units, so splitting and summing never drift. The number of decimals
 * comes from the currency (company base currency, see `shared/currencies`).
 */
import { currencyDefinition } from '@/shared/currencies';

export type Minor = number;

export type CurrencySpec = { code: string; decimals: number };

export function currencySpec(code: string | null | undefined): CurrencySpec {
  const upper = (code ?? '').trim().toUpperCase() || 'YER';
  return { code: upper, decimals: currencyDefinition(upper)?.decimals ?? 2 };
}

const factor = (decimals: number) => 10 ** decimals;

/** "12.345" → minor units, rounded half away from zero to the currency's precision. */
export function toMinor(major: string | number, decimals: number): Minor {
  const n = typeof major === 'number' ? major : Number(String(major).replace(/[,\s]/g, ''));
  if (!Number.isFinite(n)) return 0;
  const scaled = n * factor(decimals);
  return Math.sign(scaled) * Math.round(Math.abs(scaled) + 1e-9);
}

export function fromMinor(minor: Minor, decimals: number): number {
  return minor / factor(decimals);
}

/** Plain number text for inputs (no grouping): 1234.5 → "1234.50". */
export function minorToInput(minor: Minor, decimals: number): string {
  return fromMinor(minor, decimals).toFixed(decimals);
}

export function formatMoney(minor: Minor, currency: CurrencySpec): string {
  const value = fromMinor(minor, currency.decimals);
  try {
    return new Intl.NumberFormat('ar', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
      numberingSystem: 'latn',
    }).format(value);
  } catch {
    return `${value.toFixed(currency.decimals)} ${currency.code}`;
  }
}

export function sumMinor(values: readonly Minor[]): Minor {
  return values.reduce((total, v) => total + v, 0);
}

/**
 * Equal split in minor units. Each part gets ⌊total / n⌋; the remaining
 * units (fewer than n) go one each to the first parts in the given order.
 * The parts always add up to `total` exactly.
 *
 *   splitEqual(10000, 3) → [3334, 3333, 3333]   (100.00 YER / 3)
 *   splitEqual(1000, 3)  → [334, 333, 333]      (1.000 KWD / 3)
 */
export function splitEqual(total: Minor, n: number): Minor[] {
  if (n <= 0) return [];
  const sign = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const base = Math.floor(abs / n);
  const remainder = abs - base * n;
  return Array.from({ length: n }, (_, i) => sign * (base + (i < remainder ? 1 : 0)));
}

/**
 * Split by percentages (any positive weights; normalized). Largest remainder
 * method: parts are floored, then the leftover units go to the largest
 * fractional remainders (ties: earlier entries first). Sums to `total`.
 */
export function splitByWeights(total: Minor, weights: readonly number[]): Minor[] {
  const sumW = weights.reduce((t, w) => t + (w > 0 ? w : 0), 0);
  if (weights.length === 0 || sumW <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (Math.max(w, 0) / sumW) * total);
  const floors = exact.map((x) => Math.floor(x + 1e-9));
  let left = total - sumMinor(floors);
  const order = exact
    .map((x, i) => ({ i, frac: x - floors[i]! }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0 && k < order.length; k += 1, left -= 1) {
    floors[order[k]!.i]! += 1;
  }
  return floors;
}
