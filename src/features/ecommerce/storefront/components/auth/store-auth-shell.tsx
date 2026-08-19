import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Shared card shell for store customer login / register (not ERP). */
export function StoreAuthShell({ eyebrow, title, description, children, footer }: Props) {
  return (
    <div className="mx-auto w-full max-w-md">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
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
