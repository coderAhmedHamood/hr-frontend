/** مسار وحدة «الهيكل الإداري» في التطبيق (سجل الموظفين فقط — باقي عناصر المنظمة انتقلت لتطبيق النظام) */
export const HR_ORGANIZATION_BASE = '/hr/organization' as const;

export const hrOrganizationRoutes = {
  employees: `${HR_ORGANIZATION_BASE}/employees`,
  employee: (id: string) => `${HR_ORGANIZATION_BASE}/employees/${encodeURIComponent(id)}`,
  /** Deep-link into employee profile attachments library (optional group filter). */
  employeeAttachments: (id: string, opts?: { libraryGroup?: string; documentType?: string }) => {
    const params = new URLSearchParams({ section: 'attachments' });
    if (opts?.libraryGroup) params.set('libraryGroup', opts.libraryGroup);
    if (opts?.documentType) params.set('documentType', opts.documentType);
    return `${HR_ORGANIZATION_BASE}/employees/${encodeURIComponent(id)}?${params.toString()}`;
  },
} as const;
