/**
 * قراءة متغيرات البيئة العامة من مكان واحد (لا تستخدم process.env مباشرة في المكوّنات).
 */
export const publicConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL?.trim() || '/api-backend',
  hereApiKey: (process.env.NEXT_PUBLIC_HERE_API_KEY ?? '').trim(),
  appName: (process.env.NEXT_PUBLIC_APP_NAME ?? '').trim(),
  appEnv: (process.env.NEXT_PUBLIC_ENV ?? '').trim(),
} as const;
