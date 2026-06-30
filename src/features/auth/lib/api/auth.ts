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

export type AuthMessageResult = {
  message: string;
};

export type ResetPasswordPayload = {
  email: string;
  code: string;
  newPassword: string;
};

export type ActivateAccountPayload = {
  email: string;
  code: string;
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

  forgotPassword(email: string) {
    return apiRequest<AuthMessageResult>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  resetPassword(payload: ResetPasswordPayload) {
    return apiRequest<AuthMessageResult>('/auth/reset-password', {
      method: 'POST',
      body: payload,
    });
  },

  requestActivation(email: string) {
    return apiRequest<AuthMessageResult>('/auth/request-activation', {
      method: 'POST',
      body: { email },
    });
  },

  activateAccount(payload: ActivateAccountPayload) {
    return apiRequest<AuthMessageResult>('/auth/activate-account', {
      method: 'POST',
      body: payload,
    });
  },
};
