/** Wall-clock HH:mm in a fixed offset (same approach as daily breakdown UI). */
export function isoToTimePickerValue(
  iso: string | null | undefined,
  timezoneOffsetMinutes: number,
): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const localMs = parsed.getTime() + timezoneOffsetMinutes * 60_000;
  const local = new Date(localMs);
  const h = local.getUTCHours();
  const m = local.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timePickerToIso(
  workDate: string,
  time: string,
  timezoneOffsetMinutes: number,
): string | null {
  const trimmed = time.trim();
  if (!trimmed || !/^\d{1,2}:\d{2}$/.test(trimmed)) return null;
  const [hStr, mStr] = trimmed.split(':');
  const clock = `${hStr!.padStart(2, '0')}:${mStr!.padStart(2, '0')}`;
  const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(timezoneOffsetMinutes);
  const offH = String(Math.floor(abs / 60)).padStart(2, '0');
  const offM = String(abs % 60).padStart(2, '0');
  return `${workDate}T${clock}:00${sign}${offH}:${offM}`;
}

export function defaultTimezoneOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export function formatWallClock12FromHHmm(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const h24 = Number(match[1]);
  const mm = match[2] ?? '00';
  const period = h24 < 12 ? 'ص' : 'م';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm}${period}`;
}

export function formatShiftRangeAr(startTime: string, endTime: string): string {
  return `${formatWallClock12FromHHmm(startTime)} — ${formatWallClock12FromHHmm(endTime)}`;
}

export function formatClockLabel(
  iso: string | null | undefined,
  timezoneOffsetMinutes: number,
): string {
  const value = isoToTimePickerValue(iso, timezoneOffsetMinutes);
  if (!value) return '—';
  return formatWallClock12FromHHmm(value);
}
