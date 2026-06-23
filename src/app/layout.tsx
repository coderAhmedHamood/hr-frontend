import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Rubik } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layouts/providers';
import { THEME_STORAGE_KEY } from '@/shared/constants/theme';

const bodyFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Rubik({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'روز | منصة الموارد البشرية الذكية',
  description: 'نظام متكامل لإدارة الموارد البشرية — موظفين، حضور، رواتب، تقارير',
  icons: { icon: '/logo.webp' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(!raw)return;var parsed=JSON.parse(raw);var mode=parsed.state&&parsed.state.mode;if(mode==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
