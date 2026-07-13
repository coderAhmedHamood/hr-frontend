import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { resolveSystemAppLaunchPath } from '@/features/system/constants/app-launch';

export type ApplicationResponseDto = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  icon: string | null;
  routePath: string | null;
  sortOrder: number;
  isActive: boolean;
  status: string;
};

export const applicationsApi = {
  getLauncher() {
    return apiRequest<ApplicationResponseDto[]>('/applications/launcher');
  },

  getAll(query?: { limit?: number }) {
    return apiRequest<PaginatedResult<ApplicationResponseDto>>('/applications', { query });
  },
};

/** Where the app tile navigates — HR lands on employees list. */
export function resolveApplicationLaunchPath(app: ApplicationResponseDto): string {
  const base = app.routePath?.trim();
  if (app.code === 'hr') return '/hr/organization/employees';
  if (app.code === 'accounting') return '/accounting';
  if (app.code === 'system' && (!base || base === '/system')) {
    return resolveSystemAppLaunchPath();
  }
  return base || '/';
}
