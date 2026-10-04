/**
 * Moved to `@/shared/api/global-error-handler` (phase 1.6): the API client is platform code,
 * not HR. Kept as a re-export so existing imports keep working; new code
 * imports from `@/shared/api/global-error-handler`.
 */
export * from '@/shared/api/global-error-handler';
