/** مسار وحدة إدارة المنظمة في تطبيق النظام (جهات الاتصال، المسميات، الفروع، الأقسام، الشركات، الهيكل التنظيمي، الإعدادات) */
export const SYSTEM_ORGANIZATION_BASE = '/system/organization' as const;

export const systemOrganizationRoutes = {
  contacts: `${SYSTEM_ORGANIZATION_BASE}/contacts`,
  companies: `${SYSTEM_ORGANIZATION_BASE}/companies`,
  jobTitles: `${SYSTEM_ORGANIZATION_BASE}/job-titles`,
  branches: `${SYSTEM_ORGANIZATION_BASE}/branches`,
  departments: `${SYSTEM_ORGANIZATION_BASE}/departments`,
  /** شجرة الهيكل التنظيمي */
  chart: `${SYSTEM_ORGANIZATION_BASE}/chart`,
  /** إعدادات الموارد البشرية والنظام */
  pages: `${SYSTEM_ORGANIZATION_BASE}/pages`,
  pagesHr: `${SYSTEM_ORGANIZATION_BASE}/pages/hr`,
  pagesOrganization: `${SYSTEM_ORGANIZATION_BASE}/pages/organization`,
  pagesCompany: `${SYSTEM_ORGANIZATION_BASE}/pages/company`,
} as const;
