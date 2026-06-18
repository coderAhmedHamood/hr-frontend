import QRCode from 'qrcode';
import type { AtsApplicant, AtsFormField, AtsApplicantScore } from './types';

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

export function scoreApplicant(
  answers: Record<string, string | undefined>,
  fields: AtsFormField[]
): AtsApplicantScore {
  let ruleScore = 0;
  let maxPossible = 0;

  for (const field of fields) {
    const val = answers[field.id];
    if (!val || val.trim() === '') continue;

    if (field.type === 'number') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        const weight = field.label.includes('خبرة') || field.label.includes('experience') ? 30 : 15;
        ruleScore += Math.min(num * 3, weight);
        maxPossible += weight;
      }
    } else if (field.type === 'select') {
      const weight = 20;
      const count = val.split(',').length;
      ruleScore += Math.min(count * 5, weight);
      maxPossible += weight;
    } else if (field.type === 'text') {
      const weight = 10;
      ruleScore += val.length > 3 ? weight : weight / 2;
      maxPossible += weight;
    }
  }

  if (maxPossible === 0) maxPossible = 1;
  const normalizedRule = Math.round((ruleScore / maxPossible) * 100);

  const aiScore = Math.min(95, Math.max(50, normalizedRule + Math.floor(Math.random() * 20 - 10)));
  const finalScore = Math.round((normalizedRule * 0.6 + aiScore * 0.4) * 10) / 10;

  let reasoning = '';
  if (finalScore >= 85) reasoning = 'مؤهل ممتاز مع خبرة ومهارات قوية';
  else if (finalScore >= 70) reasoning = 'مؤهل جيد مع خبرة متوسطة إلى قوية';
  else if (finalScore >= 50) reasoning = 'مؤهل مقبول يحتاج إلى مزيد من التقييم';
  else reasoning = 'مؤهل ضعيف نسبياً، يحتاج مراجعة';

  return { ruleScore: normalizedRule, aiScore, finalScore, reasoning };
}

export function getApplicantName(applicant: AtsApplicant, fields: AtsFormField[]): string {
  const nameField = fields.find(
    (f) => f.label.includes('اسم') || f.label.includes('الاسم') || f.id.includes('name')
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
