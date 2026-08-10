import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  viewAllHref?: `/store${string}`;
  viewAllLabel?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-arabic-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {viewAllHref && viewAllLabel ? (
            <Link
              href={viewAllHref}
              prefetch={false}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              {viewAllLabel}
            </Link>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  );
}
