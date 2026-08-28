/** Converts a SAR amount to Arabic words (parity with backend cash-receipt util). */
const ONES = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر',
  'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
];
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = [
  '', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة',
];

function underHundred(n: number): string {
  if (n <= 0) return '';
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (o === 0) return TENS[t];
  return `${ONES[o]} و${TENS[t]}`;
}

function underThousand(n: number): string {
  if (n <= 0) return '';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS[h]);
  if (rest > 0) parts.push(underHundred(rest));
  return parts.join(' و');
}

function scaleWord(
  n: number,
  singular: string,
  dual: string,
  plural: string,
  feminineSingular?: string,
): string {
  if (n === 0) return '';
  if (n === 1) return feminineSingular ?? singular;
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return `${underThousand(n)} ${plural}`;
  return `${underThousand(n)} ${singular}`;
}

function integerToWords(n: number): string {
  if (n === 0) return 'صفر';
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;
  const parts: string[] = [];
  if (millions > 0) parts.push(scaleWord(millions, 'مليون', 'مليونان', 'ملايين'));
  if (thousands > 0) parts.push(scaleWord(thousands, 'ألف', 'ألفان', 'آلاف', 'ألف'));
  if (rest > 0) parts.push(underThousand(rest));
  return parts.join(' و');
}

export function amountInWordsAr(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    return 'صفر ريال سعودي فقط لا غير';
  }
  const rounded = Math.round(amount * 100) / 100;
  const riyals = Math.floor(rounded + 1e-9);
  const halalas = Math.round((rounded - riyals) * 100);
  if (riyals === 0 && halalas === 0) return 'صفر ريال سعودي فقط لا غير';
  const parts: string[] = [];
  if (riyals > 0) parts.push(`${integerToWords(riyals)} ريال سعودي`);
  if (halalas > 0) parts.push(`${integerToWords(halalas)} هللة`);
  return `${parts.join(' و')} فقط لا غير`;
}
