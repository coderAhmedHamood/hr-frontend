/** مسارات وحدة إدارة المنظمة داخل تطبيق النظام (المستخدمين، المسميات، الفروع، …) */
export const SYSTEM_ORGANIZATION_BASE = '/system/organization' as const;

export const systemOrganizationRoutes = {
  /** دليل مستخدمي النظام — منفصل تمامًا عن تطبيق Partners على `/contacts` */
  users: `${SYSTEM_ORGANIZATION_BASE}/users`,
  /** @deprecated استخدم `users` — يُبقى للتوافق مع روابط قديمة */
  contacts: `${SYSTEM_ORGANIZATION_BASE}/users`,
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
