/** Minimal auth user fixture for tests. Extend as domains need richer profiles. */
export const adminUser = {
  id: 'user-admin-1',
  email: 'admin@test.com',
  nameAr: 'مدير النظام',
  nameEn: 'System Admin',
} as const;

export const employeeUser = {
  id: 'user-employee-1',
  email: 'employee@test.com',
  nameAr: 'موظف تجريبي',
  nameEn: 'Test Employee',
} as const;
