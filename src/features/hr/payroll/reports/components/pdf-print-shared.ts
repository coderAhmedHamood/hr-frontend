import { toWesternDigits } from '@/shared/utils';

export const PDF_PRINT_C = {
  primary: '#1a3a5c',
  gold: '#b5910a',
  tableHead: '#c8dfc4',
  border: '#aaaaaa',
  muted: '#555555',
  light: '#f5f5f5',
} as const;

export type CompanyInfo = { nameAr: string; nameEn: string; crNumber?: string };

export function fmtPrintNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(Math.round(n));
}

export function fmtPrintDate(iso: string): string {
  try {
    return toWesternDigits(
      new Date(iso).toLocaleDateString('ar-SA-u-ca-gregory', {
        numberingSystem: 'latn',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
  } catch {
    return iso;
  }
}
