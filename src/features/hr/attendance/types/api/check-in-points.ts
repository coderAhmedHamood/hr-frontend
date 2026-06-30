import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type CheckInPointResponseDto = {
  id: string;
  companyId: string;
  nameAr: string;
  nameEn: string | null;
  latitude: string;
  longitude: string;
  radiusMeters: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCheckInPointDto = {
  companyId: string;
  nameAr: string;
  nameEn?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive?: boolean;
};

export type UpdateCheckInPointDto = Omit<Partial<CreateCheckInPointDto>, 'companyId'>;

export type CheckInPointListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
  archiveScope?: OrganizationArchiveScope;
};
