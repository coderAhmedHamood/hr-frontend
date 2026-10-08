/**
 * Local persistence of the prototype (this browser only). One slot per
 * company and user: nothing is shared with other users or devices. Export /
 * import (JSON) and reset exist for testing.
 *
 * The future backend replaces this module (the store calls only these
 * functions), not the domain or the screens.
 */
import type { ExpensesData } from '../domain/types';

const PREFIX = 'erp-expenses:v1';

export function scopeKey(companyId: string, userId: string): string {
  return `${PREFIX}:${companyId}:${userId}`;
}

function isData(value: unknown): value is ExpensesData {
  const d = value as Partial<ExpensesData> | null;
  return (
    !!d &&
    d.version === 1 &&
    Array.isArray(d.expenses) &&
    Array.isArray(d.custodies) &&
    Array.isArray(d.custodyMoves) &&
    Array.isArray(d.settlements) &&
    Array.isArray(d.advances) &&
    Array.isArray(d.categories) &&
    !!d.settings
  );
}

export function loadData(key: string): ExpensesData | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** False when the browser refuses (private mode, quota). */
export function saveData(key: string, data: ExpensesData): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
}

export function exportJson(data: ExpensesData): string {
  return JSON.stringify(data, null, 2);
}

/** Parses an export; throws with an Arabic message when the file is not one. */
export function parseImport(text: string): ExpensesData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('الملف ليس JSON صالحاً');
  }
  if (!isData(parsed)) throw new Error('الملف ليس تصديراً من تطبيق المصاريف (الإصدار 1)');
  return parsed;
}
