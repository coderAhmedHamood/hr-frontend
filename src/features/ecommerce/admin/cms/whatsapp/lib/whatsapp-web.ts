/** Shared popup name so QR login and customer chats reuse one WhatsApp Web window. */
export const WHATSAPP_WEB_WINDOW_NAME = 'nadara-whatsapp-web';

const WHATSAPP_WEB_HOME = 'https://web.whatsapp.com/';

/**
 * Strip to digits. Regional helpers:
 * - Yemen local 7xxxxxxxx / 07xxxxxxxx → 967…
 * - KSA local 05xxxxxxxx → 966…
 */
export function normalizeWhatsappPhone(raw: string | null | undefined): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.length === 9 && digits.startsWith('7')) {
    digits = `967${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('07')) {
    digits = `967${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith('05')) {
    digits = `966${digits.slice(1)}`;
  }

  return digits;
}

export function buildWhatsappWebUrl(phone?: string | null): string {
  const digits = normalizeWhatsappPhone(phone);
  if (!digits) return WHATSAPP_WEB_HOME;
  return `https://web.whatsapp.com/send?phone=${digits}`;
}

/**
 * Opens WhatsApp Web in one named window (reused for QR login and customer chats).
 */
export function openWhatsappWeb(options: { phone?: string | null } = {}): Window | null {
  if (typeof window === 'undefined') return null;
  const popup = window.open(buildWhatsappWebUrl(options.phone), WHATSAPP_WEB_WINDOW_NAME);
  popup?.focus();
  return popup;
}
