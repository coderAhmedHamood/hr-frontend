import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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
      { source: '/departments', destination: '/hr/organization/departments', permanent: true },
      { source: '/hr/departments', destination: '/hr/organization/departments', permanent: true },
      { source: '/branches', destination: '/hr/organization/branches', permanent: true },
      { source: '/hr/branches', destination: '/hr/organization/branches', permanent: true },
      { source: '/dashboard', destination: '/hr/dashboard', permanent: true },
      { source: '/contacts', destination: '/hr/organization/contacts', permanent: true },
      { source: '/hr/contacts', destination: '/hr/organization/contacts', permanent: true },
      { source: '/attendance', destination: '/hr/attendance', permanent: true },
      { source: '/job-titles', destination: '/hr/organization/job-titles', permanent: true },
      { source: '/hr/job-titles', destination: '/hr/organization/job-titles', permanent: true },
      { source: '/organization', destination: '/hr/organization/chart', permanent: true },
      { source: '/permissions', destination: '/hr/permissions/roles', permanent: true },
      { source: '/settings', destination: '/hr/organization/pages/hr', permanent: true },
      { source: '/hr/settings', destination: '/hr/organization/pages/hr', permanent: true },
      { source: '/hr/settings/hr', destination: '/hr/organization/pages/hr', permanent: true },
      { source: '/hr/settings/organization', destination: '/hr/organization/pages/organization', permanent: true },
      { source: '/notifications', destination: '/hr/dashboard', permanent: true },
      { source: '/hr/notifications', destination: '/hr/dashboard', permanent: true },
    ];
  },
};

export default nextConfig;
