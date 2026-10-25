/** Convert an IANA timezone (company settings) to minutes east of UTC. */
export function timezoneOffsetMinutes(
  timeZone: string | null | undefined,
  at: Date = new Date(),
): number {
  const zone = timeZone?.trim();
  if (!zone) return 180;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
    const match = /([+-])(\d{1,2})(?::?(\d{2}))?/.exec(name);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3] || 0));
  } catch {
    return 180;
  }
}

export const COMPANY_TIMEZONES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'Asia/Aden', label: 'عدن (UTC+3)' },
  { value: 'Asia/Riyadh', label: 'الرياض (UTC+3)' },
  { value: 'Asia/Kuwait', label: 'الكويت (UTC+3)' },
  { value: 'Asia/Qatar', label: 'الدوحة (UTC+3)' },
  { value: 'Asia/Bahrain', label: 'المنامة (UTC+3)' },
  { value: 'Asia/Baghdad', label: 'بغداد (UTC+3)' },
  { value: 'Asia/Amman', label: 'عمّان' },
  { value: 'Africa/Cairo', label: 'القاهرة (UTC+2)' },
  { value: 'Asia/Dubai', label: 'دبي (UTC+4)' },
  { value: 'Asia/Muscat', label: 'مسقط (UTC+4)' },
  { value: 'Europe/Istanbul', label: 'إسطنبول (UTC+3)' },
  { value: 'UTC', label: 'UTC' },
];
