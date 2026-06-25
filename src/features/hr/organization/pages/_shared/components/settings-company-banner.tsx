import { Building2 } from 'lucide-react';

type Props = {
  companyName: string;
  description: string;
};

export function SettingsCompanyBanner({ companyName, description }: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, transparent 55%)',
        }}
      />
      <div className="relative flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-sm font-semibold sm:text-base">{companyName}</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}
