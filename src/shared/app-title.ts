import { publicConfig } from '@/shared/config';

/** Name used when no company is known (public pages, a device that never signed in). */
export const DEFAULT_APP_TITLE = 'نظام الموارد البشرية';

/**
 * The deployment's name — `NEXT_PUBLIC_APP_NAME`, else the generic default.
 * Signed-in screens show the company's own name (from its settings) instead.
 */
export const APP_TITLE = publicConfig.appName || DEFAULT_APP_TITLE;
