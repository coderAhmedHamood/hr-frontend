import { toast } from 'sonner';
import { useCan } from '@/features/auth/hooks/use-can';

const DEFAULT_DENIED_MESSAGE = 'ليس لديك صلاحية لاستخدام هذا الفلتر';

/**
 * Filter-level access gate (branch-scoped, via `useCan()` — filters act on
 * the current branch/company context). Missing filter permission must never
 * block the page; it only disables/limits the filter control and warns on
 * interaction.
 *
 * Use this to wire a `ListFilterInlineSelect` entry (or any custom filter
 * control) so opening/changing it without permission shows a toast instead
 * of silently failing or throwing.
 */
export function useFilterPermission(permissionCode: string | null | undefined, deniedMessage = DEFAULT_DENIED_MESSAGE) {
  const can = useCan();
  const allowed = permissionCode == null || can(permissionCode);

  const notifyDenied = () => toast.error(deniedMessage);

  /** Wrap an inline-select's `onOpen` so opening without permission warns instead of loading data. */
  const guardOnOpen = (onOpen?: () => void) => () => {
    if (!allowed) {
      notifyDenied();
      return;
    }
    onOpen?.();
  };

  /** Wrap an inline-select's `onChange` so changing the value without permission warns and no-ops. */
  const guardOnChange = (onChange: (value: string) => void) => (value: string) => {
    if (!allowed) {
      notifyDenied();
      return;
    }
    onChange(value);
  };

  return { allowed, notifyDenied, guardOnOpen, guardOnChange };
}
