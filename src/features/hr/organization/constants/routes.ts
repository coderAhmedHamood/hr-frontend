/** مسار وحدة «الهيكل الإداري» في التطبيق (سجل الموظفين فقط — باقي عناصر المنظمة انتقلت لتطبيق النظام) */
export const HR_ORGANIZATION_BASE = '/hr/organization' as const;

export const hrOrganizationRoutes = {
  employees: `${HR_ORGANIZATION_BASE}/employees`,
  employee: (id: string) => `${HR_ORGANIZATION_BASE}/employees/${encodeURIComponent(id)}`,
} as const;
