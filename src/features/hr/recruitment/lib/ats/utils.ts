import QRCode from 'qrcode';
import type { AtsApplicant, AtsFormField } from './types';

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export function publicJobUrl(slug: string): string {
  if (typeof window === 'undefined') return `/f/${slug}`;
  return `${window.location.origin}/f/${slug}`;
}

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 256, margin: 2, errorCorrectionLevel: 'M' });
}

export function downloadQR(dataUrl: string, fileName = 'qr-code.png') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export function getApplicantName(applicant: AtsApplicant, fields: AtsFormField[]): string {
  if (applicant.applicantName?.trim()) return applicant.applicantName.trim();
  const nameField = fields.find(
    (f) => f.coreKey === 'applicantName' || f.label.includes('اسم') || f.label.includes('الاسم') || f.id.includes('name'),
  );
  const val = nameField ? applicant.answers[nameField.id] : undefined;
  return typeof val === 'string' && val ? val : 'متقدم جديد';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
}
