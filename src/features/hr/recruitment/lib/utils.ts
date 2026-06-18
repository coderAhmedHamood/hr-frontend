import QRCode from 'qrcode';

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 300, margin: 2, errorCorrectionLevel: 'M' });
}

export function downloadQrCode(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getPublicFormUrl(formId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/apply/${formId}`;
}
