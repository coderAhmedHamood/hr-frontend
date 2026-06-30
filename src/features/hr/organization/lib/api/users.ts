import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { AccessProfile } from '@/features/auth/types/access-profile';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type UserCompanyLink = {
  id: string;
  companyId: string;
  companyCode?: string | null;
  companyNameAr?: string | null;
  companyNameEn?: string | null;
  companyLogoUrl?: string | null;
  companyCommercialRegistrationNo?: string | null;
  companyPrimaryColor?: string | null;
  companySecondaryColor?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UserBranchLink = {
  id: string;
  branchId: string;
  branchCode?: string | null;
  branchNameAr?: string | null;
  branchNameEn?: string | null;
  companyId?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UserResponseDto = {
  id: string;
  email: string;
  phone: string | null;
  fullNameAr: string | null;
  fullNameEn: string | null;
  avatarUrl: string | null;
  userType: string | null;
  defaultCompanyId: string | null;
  defaultBranchId: string | null;
  companies: UserCompanyLink[];
  branches: UserBranchLink[];
  isActive: boolean;
  isVerified: boolean;
  status: string;
  canSignIn: boolean;
  languageCode: string | null;
  timezone: string | null;
  lastLoginAt: string | null;
  passwordChangedAt?: string | null;
  notes: string | null;
  employeeId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type CreateUserDto = {
  email: string;
  password: string;
  phone?: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  avatarUrl?: string | null;
  userType?: string | null;
  defaultCompanyId?: string | null;
  defaultBranchId?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  status?: string | null;
  languageCode?: string | null;
  timezone?: string | null;
  notes?: string | null;
  employeeId?: string | null;
};

export type UpdateUserDto = {
  email?: string;
  password?: string;
  phone?: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  avatarUrl?: string | null;
  userType?: string | null;
  defaultCompanyId?: string | null;
  defaultBranchId?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  status?: string | null;
  languageCode?: string | null;
  timezone?: string | null;
  notes?: string | null;
  employeeId?: string | null;
};

export type UsersListQuery = {
  page?: number;
  limit?: number;
  archiveScope?: OrganizationArchiveScope;
};

export type SetDefaultCompanyDto = {
  companyId: string;
};

export const usersApi = {
  getAll(query?: UsersListQuery) {
    return apiRequest<PaginatedResult<UserResponseDto>>('/users', { query });
  },
  getById(id: string) {
    return apiRequest<UserResponseDto>(`/users/${id}`);
  },
  create(payload: CreateUserDto) {
    return apiRequest<UserResponseDto>('/users', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateUserDto) {
    return apiRequest<UserResponseDto>(`/users/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/users/${id}`, { method: 'DELETE' });
  },
  setDefaultCompany(userId: string, payload: SetDefaultCompanyDto) {
    return apiRequest<AccessProfile>(`/users/${userId}/default-company`, {
      method: 'PATCH',
      body: payload,
    });
  },
};
