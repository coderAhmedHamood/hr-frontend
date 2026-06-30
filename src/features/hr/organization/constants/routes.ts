/** مسار وحدة «الهيكل الإداري» في التطبيق (موظفون، فروع، شجرة، …) */
export const HR_ORGANIZATION_BASE = '/hr/organization' as const;

export const hrOrganizationRoutes = {
  employees: `${HR_ORGANIZATION_BASE}/employees`,
  employee: (id: string) => `${HR_ORGANIZATION_BASE}/employees/${encodeURIComponent(id)}`,
  contacts: `${HR_ORGANIZATION_BASE}/contacts`,
  companies: `${HR_ORGANIZATION_BASE}/companies`,
  jobTitles: `${HR_ORGANIZATION_BASE}/job-titles`,
  branches: `${HR_ORGANIZATION_BASE}/branches`,
  departments: `${HR_ORGANIZATION_BASE}/departments`,
  /** شجرة الهيكل التنظيمي */
  chart: `${HR_ORGANIZATION_BASE}/chart`,
  /** إعدادات الموارد البشرية والنظام */
  pages: `${HR_ORGANIZATION_BASE}/pages`,
  pagesHr: `${HR_ORGANIZATION_BASE}/pages/hr`,
  pagesOrganization: `${HR_ORGANIZATION_BASE}/pages/organization`,
  pagesCompany: `${HR_ORGANIZATION_BASE}/pages/company`,
} as const;
