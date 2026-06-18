import { apiRequest } from '@/features/hr/lib/api/client';
import type { AccessProfile, AuthUser } from '@/features/auth/types/access-profile';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult = {
  access_token: string;
  userId: string;
  user: AuthUser;
  accessProfile: AccessProfile;
};

export const authApi = {
  login(payload: LoginPayload) {
    return apiRequest<LoginResult>('/auth/login', { method: 'POST', body: payload });
  },

  me() {
    return apiRequest<AuthUser>('/auth/me', { method: 'GET' });
  },

  logout() {
    return apiRequest<{ message: string; userId: string }>('/auth/logout', { method: 'POST' });
  },

  getAccessProfile(userId: string) {
    return apiRequest<AccessProfile>('/auth/access-profile', {
      method: 'POST',
      body: { userId },
    });
  },
};
