import type { ApiRequestType } from '@/features/hr/requests/lib/api/request-types';

/** فئات الطلبات المسموح إسناد موافقاتها من هذه الصفحة فقط. */
export const APPROVAL_ASSIGNMENT_REQUEST_CATEGORIES = ['leave', 'attendance', 'advance'] as const;

export type ApprovalAssignmentRequestCategory =
  (typeof APPROVAL_ASSIGNMENT_REQUEST_CATEGORIES)[number];

const CATEGORY_SET = new Set<string>(APPROVAL_ASSIGNMENT_REQUEST_CATEGORIES);

const SLUG_ALIASES: Record<ApprovalAssignmentRequestCategory, readonly string[]> = {
  leave: ['leave', 'leave-request'],
  attendance: ['attendance', 'attendance-correction', 'attendance-corrections'],
  advance: ['advance', 'salary-advance', 'employee-advance'],
};

function matchesCategorySlug(category: ApprovalAssignmentRequestCategory, slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return SLUG_ALIASES[category].some((s) => normalized === s || normalized.includes(s));
}

export function isApprovalAssignableRequestType(rt: ApiRequestType): boolean {
  const category = rt.requestCategory?.trim().toLowerCase();
  if (category && (CATEGORY_SET.has(category) || category === 'attendance_correction')) {
    return true;
  }

  const slug = rt.slug?.trim().toLowerCase() ?? '';
  return APPROVAL_ASSIGNMENT_REQUEST_CATEGORIES.some((cat) => matchesCategorySlug(cat, slug));
}

export function filterApprovalAssignableRequestTypes(types: ApiRequestType[]): ApiRequestType[] {
  return types.filter(isApprovalAssignableRequestType);
}
