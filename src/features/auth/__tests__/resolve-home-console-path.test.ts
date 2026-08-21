import {
  resolveHomeConsolePath,
  resolvePostLoginDestination,
} from '@/features/auth/lib/resolve-home-console-path';
import {
  resolveApplicationLaunchPath,
  type ApplicationResponseDto,
} from '@/features/system/applications/lib/api/applications';

describe('resolveHomeConsolePath', () => {
  it('maps system_owner to /system-owner', () => {
    expect(resolveHomeConsolePath('system_owner')).toBe('/system-owner');
  });

  it('accepts hyphenated system-owner', () => {
    expect(resolveHomeConsolePath('system-owner')).toBe('/system-owner');
  });

  it('returns null for unknown consoles', () => {
    expect(resolveHomeConsolePath('hr')).toBeNull();
  });
});

describe('resolvePostLoginDestination', () => {
  it('prefers returnTo over homeConsole', () => {
    expect(resolvePostLoginDestination('/hr', 'system_owner')).toBe('/hr');
  });

  it('uses homeConsole when returnTo is absent', () => {
    expect(resolvePostLoginDestination(null, 'system_owner')).toBe('/system-owner');
  });

  it('falls back to launcher when neither is set', () => {
    expect(resolvePostLoginDestination(null, null)).toBe('/');
  });
});

describe('resolveApplicationLaunchPath — system-owner', () => {
  const base: ApplicationResponseDto = {
    id: 'so-1',
    code: 'system-owner',
    nameAr: 'إدارة المنصة',
    nameEn: 'Platform Admin',
    description: null,
    icon: 'crown',
    routePath: '/system-owner',
    sortOrder: 0,
    isActive: true,
    status: 'active',
  };

  it('opens backend routePath /system-owner', () => {
    expect(resolveApplicationLaunchPath(base)).toBe('/system-owner');
  });

  it('defaults to /system-owner when routePath is empty', () => {
    expect(resolveApplicationLaunchPath({ ...base, routePath: null })).toBe('/system-owner');
  });
});
