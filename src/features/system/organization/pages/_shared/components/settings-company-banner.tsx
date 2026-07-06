import type { LucideIcon } from 'lucide-react';
import { Building2 } from 'lucide-react';

type Props = {
  companyName: string;
  description: string;
  icon?: LucideIcon;
  eyebrow?: string;
};

export function SettingsCompanyBanner({ companyName, description, icon: Icon = Building2, eyebrow }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <div className="relative flex items-center gap-3.5 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner-soft sm:h-12 sm:w-12">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">{eyebrow}</p>
          ) : null}
          <h2 className="truncate font-display text-sm font-semibold sm:text-base">{companyName}</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}
