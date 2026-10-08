import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type AuthTabs = {
  active: 'login' | 'register';
  loginHref: string;
  registerHref: string;
  loginLabel: string;
  registerLabel: string;
  ariaLabel: string;
};

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  /** «تسجيل الدخول | إنشاء حساب» on top, so the other way in is never missed. */
  tabs?: AuthTabs;
};

/** Shared card shell for store customer login / register (not ERP). */
export function StoreAuthShell({ eyebrow, title, description, children, footer, tabs }: Props) {
  return (
    <div className="mx-auto w-full max-w-md">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {tabs ? (
          <nav
            aria-label={tabs.ariaLabel}
            className="grid grid-cols-2 gap-1 border-b border-border/80 bg-muted/40 p-1.5"
          >
            {(
              [
                ['login', tabs.loginHref, tabs.loginLabel],
                ['register', tabs.registerHref, tabs.registerLabel],
              ] as const
            ).map(([key, href, label]) => {
              const active = tabs.active === key;
              return (
                <Link
                  key={key}
                  href={href}
                  prefetch={false}
                  replace
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center justify-center rounded-2xl text-sm font-semibold transition-colors',
                    active
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        ) : null}
        <div className="border-b border-border/80 bg-gradient-to-b from-primary/[0.06] to-transparent px-6 py-6 sm:px-8 sm:py-7">
          {eyebrow ? (
            <p className="mb-1.5 text-xs font-medium tracking-wide text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="font-arabic-display text-xl font-semibold text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
        {footer ? (
          <div className="border-t border-border px-6 py-4 text-center text-sm sm:px-8">
            {footer}
          </div>
        ) : null}
      </section>
    </div>
  );
}
