'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useThemeStore, type ThemeMode } from '@/shared/store/theme-store';
import { cn } from '@/shared/utils';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

const MODE_ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <Sun className="h-4 w-4" aria-hidden />,
  dark: <Moon className="h-4 w-4" aria-hidden />,
  system: <Monitor className="h-4 w-4" aria-hidden />,
};

export function StoreThemeSwitcher({ className }: { className?: string }) {
  const t = useTranslations('storefront.theme');
  const tA11y = useTranslations('storefront.a11y');
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <div
      className={cn('inline-flex items-center rounded-md border border-border p-0.5', className)}
      role="group"
      aria-label={tA11y('themeSwitcher')}
    >
      {MODES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
            mode === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
          aria-pressed={mode === value}
          aria-label={t(value)}
          title={t(value)}
        >
          {MODE_ICONS[value]}
        </button>
      ))}
    </div>
  );
}
