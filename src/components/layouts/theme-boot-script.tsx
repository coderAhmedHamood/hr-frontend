'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { THEME_STORAGE_KEY } from '@/shared/constants/theme';
import { COMPANY_THEME_BOOT_SCRIPT } from '@/shared/company-theme-boot-script';

const THEME_MODE_BOOT_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(!raw)return;var parsed=JSON.parse(raw);var mode=parsed.state&&parsed.state.mode;var resolved=mode==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;if(resolved==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

const LOCALE_DOCUMENT_BOOT_SCRIPT = `(function(){try{var m=location.pathname.match(/^\\/(ar|en)(\\/|$)/);if(!m)return;var loc=m[1];document.documentElement.lang=loc;document.documentElement.dir=loc==='ar'?'rtl':'ltr';}catch(e){}})();`;

const THEME_BOOT_SCRIPT = `${THEME_MODE_BOOT_SCRIPT}${LOCALE_DOCUMENT_BOOT_SCRIPT}${COMPANY_THEME_BOOT_SCRIPT}`;

/**
 * Injects anti-FOUC boot JS into the SSR HTML stream (outside the client React tree).
 * Avoids React 19's "Encountered a script tag while rendering React component" warning
 * that fires when a raw <script> sits in RootLayout.
 */
export function ThemeBootScript() {
  useServerInsertedHTML(() => (
    <script
      id="theme-boot"
      dangerouslySetInnerHTML={{
        __html: THEME_BOOT_SCRIPT,
      }}
    />
  ));

  return null;
}
