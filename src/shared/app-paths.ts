/** True when the current route belongs to the HR application. */
export function isHrAppPath(pathname: string): boolean {
  return pathname === '/hr' || pathname.startsWith('/hr/');
}

/** True when the current route belongs to the System application. */
export function isSystemAppPath(pathname: string): boolean {
  return pathname === '/system' || pathname.startsWith('/system/');
}

/** True on the applications launcher home page. */
export function isLauncherPath(pathname: string): boolean {
  return pathname === '/';
}
