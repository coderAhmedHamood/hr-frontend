import type { ReactNode } from 'react';
import type { SectionTheme, SectionVisibility } from '@/features/ecommerce/storefront/page-builder/domain/section-style';
import { cn } from '@/shared/utils';

type SectionShellProps = {
  id: string;
  theme: SectionTheme;
  visibility: SectionVisibility;
  children: ReactNode;
};

function themeClasses(theme: SectionTheme): string {
  if (theme === 'dark') return 'rounded-xl bg-card text-card-foreground';
  if (theme === 'light') return 'bg-background text-foreground';
  return '';
}

export function SectionShell({ id, theme, visibility, children }: SectionShellProps) {
  const showOnMobile = visibility.mobile;
  const showOnTablet = visibility.tablet;
  const showOnDesktop = visibility.desktop;

  return (
    <section
      id={id}
      data-section-id={id}
      className={cn(
        themeClasses(theme),
        !showOnMobile && 'max-md:hidden',
        !showOnTablet && 'md:max-lg:hidden',
        !showOnDesktop && 'lg:hidden',
      )}
    >
      {children}
    </section>
  );
}
