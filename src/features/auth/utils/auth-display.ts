import type { AuthUser } from '@/features/auth/types/access-profile';

export function getAuthDisplayName(user: AuthUser | null | undefined): string {
  const name = user?.fullNameAr?.trim() || user?.fullNameEn?.trim();
  if (name) return name;
  return 'مستخدم';
}

export function getAuthSubtitle(user: AuthUser | null | undefined): string | null {
  const subtitle = user?.positionAr?.trim() || user?.userType?.trim();
  return subtitle || null;
}

export function getAuthAvatarFallback(user: AuthUser | null | undefined): string {
  const name = user?.fullNameAr?.trim() || user?.fullNameEn?.trim();
  if (name) return name.charAt(0);
  if (user?.email) return user.email.charAt(0).toUpperCase();
  return '؟';
}
