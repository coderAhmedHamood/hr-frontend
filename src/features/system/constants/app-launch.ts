import { systemOrganizationStructureNavItems } from '@/features/system/organization/constants/nav';

/**
 * Default route when opening the System app from the launcher.
 * Mirrors the first item in the first top-nav dropdown (الهيكل التنظيمي).
 */
export function resolveSystemAppLaunchPath(): string {
  return systemOrganizationStructureNavItems[0]?.href ?? '/system/organization/contacts';
}
