import {
  companyAppsRoutes,
  systemOwnerRoutes,
} from '@/features/system-owner/constants/routes';

/** Maps backend `homeConsole` slugs to post-login landing paths. */
const HOME_CONSOLE_PATHS: Record<string, string> = {
  system_owner: systemOwnerRoutes.overview,
  company_apps: companyAppsRoutes.overview,
  launcher: '/',
};

function normalizeHomeConsoleKey(homeConsole: string): string {
  return homeConsole.trim().toLowerCase().replace(/-/g, '_');
}

export function resolveHomeConsolePath(homeConsole: string | null | undefined): string | null {
  if (!homeConsole?.trim()) return null;
  return HOME_CONSOLE_PATHS[normalizeHomeConsoleKey(homeConsole)] ?? null;
}

export function resolvePostLoginDestination(
  returnTo: string | null,
  homeConsole: string | null | undefined,
): string {
  if (
    returnTo &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//') &&
    !returnTo.startsWith('/login')
  ) {
    return returnTo;
  }
  return resolveHomeConsolePath(homeConsole) ?? '/';
}
