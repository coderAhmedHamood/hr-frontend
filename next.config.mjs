import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');

const appDir = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(appDir);
const tailwindDir = path.join(appDir, 'node_modules', 'tailwindcss');

const extraDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  /**
   * Turbopack sometimes infers a workspace root one level above this app; that breaks resolving
   * `tailwindcss` for `@import 'tailwindcss'` / the Tailwind config. Pin root + explicit aliases.
   */
  turbopack: {
    root: appDir,
    resolveAlias: {
      tailwindcss: tailwindDir,
      'tailwindcss/plugin': path.join(tailwindDir, 'dist', 'plugin.mjs'),
    },
  },
  reactStrictMode: true,
  // Allow LAN, ngrok, and other tunnel hosts in dev (Next.js blocks cross-origin /_next/* by default).
  allowedDevOrigins: [
    '127.0.0.1',
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.app',
    '*.ngrok.io',
    ...extraDevOrigins,
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    return [
      {
        source: '/api-backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/employees', destination: '/hr/organization/employees', permanent: true },
      { source: '/employees/:id', destination: '/hr/organization/employees/:id', permanent: true },
      { source: '/hr/employees/list', destination: '/hr/organization/employees', permanent: true },
      { source: '/hr/employees', destination: '/hr/organization/employees', permanent: true },
      { source: '/hr/employees/:id', destination: '/hr/organization/employees/:id', permanent: true },
      { source: '/departments', destination: '/system/organization/departments', permanent: true },
      { source: '/hr/departments', destination: '/system/organization/departments', permanent: true },
      { source: '/hr/organization/departments', destination: '/system/organization/departments', permanent: true },
      { source: '/branches', destination: '/system/organization/branches', permanent: true },
      { source: '/hr/branches', destination: '/system/organization/branches', permanent: true },
      { source: '/hr/organization/branches', destination: '/system/organization/branches', permanent: true },
      { source: '/hr', destination: '/hr/organization/employees', permanent: false },
      { source: '/dashboard', destination: '/', permanent: true },
      { source: '/hr/dashboard', destination: '/hr/organization/employees', permanent: true },
      { source: '/contacts', destination: '/system/organization/contacts', permanent: true },
      { source: '/hr/contacts', destination: '/system/organization/contacts', permanent: true },
      { source: '/hr/organization/contacts', destination: '/system/organization/contacts', permanent: true },
      { source: '/attendance', destination: '/hr/attendance', permanent: true },
      { source: '/job-titles', destination: '/system/organization/job-titles', permanent: true },
      { source: '/hr/job-titles', destination: '/system/organization/job-titles', permanent: true },
      { source: '/hr/organization/job-titles', destination: '/system/organization/job-titles', permanent: true },
      { source: '/hr/organization/companies', destination: '/system/organization/companies', permanent: true },
      { source: '/organization', destination: '/system/organization/chart', permanent: true },
      { source: '/hr/organization/chart', destination: '/system/organization/chart', permanent: true },
      { source: '/permissions', destination: '/system/permissions/roles', permanent: true },
      { source: '/hr/permissions', destination: '/system/permissions/roles', permanent: true },
      { source: '/hr/permissions/roles', destination: '/system/permissions/roles', permanent: true },
      { source: '/hr/permissions/catalog', destination: '/system/permissions/catalog', permanent: true },
      { source: '/settings', destination: '/system/organization/pages/hr', permanent: true },
      { source: '/hr/settings', destination: '/system/organization/pages/hr', permanent: true },
      { source: '/hr/settings/hr', destination: '/system/organization/pages/hr', permanent: true },
      { source: '/hr/organization/pages/hr', destination: '/system/organization/pages/hr', permanent: true },
      { source: '/hr/settings/organization', destination: '/system/organization/pages/organization', permanent: true },
      { source: '/hr/organization/pages/organization', destination: '/system/organization/pages/organization', permanent: true },
      { source: '/hr/organization/pages/company', destination: '/system/organization/pages/company', permanent: true },
      { source: '/hr/organization/pages', destination: '/system/organization/pages', permanent: true },
      { source: '/notifications', destination: '/hr/notifications/admin', permanent: true },
      { source: '/hr/notifications', destination: '/hr/notifications/admin', permanent: true },
      // Ecommerce Website CMS — shallow feature routes → Website group pages
      { source: '/cms/footer', destination: '/cms/navigation?tab=footer', permanent: false },
      { source: '/cms/pages', destination: '/cms/content?tab=pages', permanent: false },
      { source: '/cms/blog', destination: '/cms/content?tab=blog', permanent: false },
      { source: '/cms/faq', destination: '/cms/content?tab=faq', permanent: false },
      { source: '/cms/seo', destination: '/cms/settings', permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
