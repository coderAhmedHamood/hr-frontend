/**
 * قراءة متغيرات البيئة العامة من مكان واحد (لا تستخدم process.env مباشرة في المكوّنات).
 */
if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('[config] NEXT_PUBLIC_API_URL is not set — falling back to /api-backend. Set this in your .env.local for local dev or in your deployment environment.');
}

export const publicConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL?.trim() || '/api-backend',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim(),
  hereApiKey: (process.env.NEXT_PUBLIC_HERE_API_KEY ?? '').trim(),
  appName: (process.env.NEXT_PUBLIC_APP_NAME ?? '').trim(),
  appEnv: (process.env.NEXT_PUBLIC_ENV ?? '').trim(),
} as const;
