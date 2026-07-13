const NAV_PREVIOUS_KEY = 'app:nav:previous';
const NAV_CURRENT_KEY = 'app:nav:current';

/** Remember the last in-app path so «back» can avoid brittle browser history. */
export function recordNavigation(path: string) {
  if (typeof window === 'undefined') return;
  const normalized = path.trim() || '/';
  const current = sessionStorage.getItem(NAV_CURRENT_KEY);
  if (current && current !== normalized) {
    sessionStorage.setItem(NAV_PREVIOUS_KEY, current);
  }
  sessionStorage.setItem(NAV_CURRENT_KEY, normalized);
}

export function peekPreviousNavigation(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(NAV_PREVIOUS_KEY);
}

function isUsableBackTarget(target: string, current: string): boolean {
  if (!target || target === current) return false;
  if (target.startsWith('/login')) return false;
  return true;
}

/** Resolve where «back» should land — never returns the current URL. */
export function resolveSafeBackTarget(fallback = '/'): string {
  if (typeof window === 'undefined') return fallback;

  const current = window.location.pathname + window.location.search;
  const previous = peekPreviousNavigation();

  if (previous && isUsableBackTarget(previous, current)) {
    return previous;
  }

  return fallback;
}

type RouterLike = { push: (href: string) => void; back: () => void };

/**
 * Reliable in-app back: prefers the tracked previous route, then falls back to
 * the launcher. Avoids `router.back()` on 404 / cross-layout jumps where the
 * browser history entry can remount auth shell into an infinite loading state.
 */
export function navigateSafeBack(router: RouterLike, fallback = '/') {
  const target = resolveSafeBackTarget(fallback);
  router.push(target);
}
