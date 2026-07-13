/** Stable codes for built-in leave types provisioned per company on install. */
export const OFFICIAL_LEAVE_TYPE_CODES = [
  'work-leave',
  'annual',
  'sick',
  'unpaid',
  'maternity',
  'emergency',
  'marriage',
  'bereavement',
  'hajj',
  'paternity',
  'compensatory',
  'study',
  'remote-work',
] as const;

export type OfficialLeaveTypeCode = (typeof OFFICIAL_LEAVE_TYPE_CODES)[number];

const OFFICIAL_CODE_SET = new Set<string>(OFFICIAL_LEAVE_TYPE_CODES);

export function isOfficialLeaveTypeCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return OFFICIAL_CODE_SET.has(code);
}

export function isOfficialLeaveType(item: {
  isSystem?: boolean;
  code?: string | null;
}): boolean {
  return item.isSystem === true || isOfficialLeaveTypeCode(item.code);
}
