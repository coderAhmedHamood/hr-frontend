const FALLBACK = '—';

export function formatHijriDate(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return FALLBACK;
  }
}

export function formatGregorianDateAr(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('ar-SA-u-ca-gregory', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso || FALLBACK;
  }
}

export function formatGregorianDateEn(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso || FALLBACK;
  }
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
