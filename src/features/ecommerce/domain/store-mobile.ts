import {
  DEFAULT_STORE_COUNTRY,
  type StoreCountry,
} from '@/features/ecommerce/domain/constants/store-country';

/**
 * A mobile number for the store's country (approved 2026-10-08), the same
 * rule the backend applies (hr-backend `core/phone/phone-numbers.ts`).
 * Every form is the same number: +966 56 242 8504 · 00966562428504 ·
 * 966562428504 · 0562428504 · 562428504 · 9660562428504. Arabic digits are
 * read as digits; letters are refused.
 */
export type StoreMobileResult =
  | { ok: true; e164: string; national: string }
  | { ok: false; reason: 'empty' | 'letters' | 'country' | 'length' | 'prefix' };

/** Arabic-Indic and Persian digits to ASCII. */
export function asciiDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function rule(country: StoreCountry) {
  return {
    dialCode: country.phoneCode || DEFAULT_STORE_COUNTRY.phoneCode,
    length: country.mobileLength ?? DEFAULT_STORE_COUNTRY.mobileLength ?? 9,
    prefixes: country.mobilePrefixes ?? [],
  };
}

export function parseStoreMobile(input: string, country: StoreCountry): StoreMobileResult {
  const raw = asciiDigits(input.trim());
  if (!raw) return { ok: false, reason: 'empty' };
  if (/[^\d+\s\-().]/.test(raw)) return { ok: false, reason: 'letters' };
  const { dialCode, length, prefixes } = rule(country);
  const hadPlus = raw.startsWith('+');
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith(dialCode) && (hadPlus || digits.length > length)) {
    digits = digits.slice(dialCode.length);
  } else if (hadPlus) {
    return { ok: false, reason: 'country' };
  }
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== length) return { ok: false, reason: 'length' };
  if (prefixes.length > 0 && !prefixes.some((p) => digits.startsWith(p))) {
    return { ok: false, reason: 'prefix' };
  }
  return { ok: true, e164: `+${dialCode}${digits}`, national: digits };
}

/** What the field keeps while typing: digits only (a leading + kept). */
export function sanitizeMobileTyping(value: string): string {
  const ascii = asciiDigits(value);
  const plus = ascii.trimStart().startsWith('+') ? '+' : '';
  return plus + ascii.replace(/\D/g, '').slice(0, 16);
}

/** The local form shown in the field once the number is valid (562428504). */
export function storeMobileNational(value: string, country: StoreCountry): string {
  const parsed = parseStoreMobile(value, country);
  return parsed.ok ? parsed.national : value;
}

/** An E.164 number saved in the store (+967771234567) to show in the field. */
export function storeMobileForField(value: string | null | undefined, country: StoreCountry): string {
  if (!value) return '';
  return storeMobileNational(value, country);
}
