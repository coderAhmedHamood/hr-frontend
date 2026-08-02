import { getTranslations } from 'next-intl/server';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type BreadcrumbItem = { name: string; path: `/store${string}` };

export async function StoreBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const t = await getTranslations('storefront');

  return (
    <nav aria-label={t('a11y.breadcrumbs')} className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.path} className="flex items-center gap-1">
            {index > 0 ? <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> : null}
            {isLast ? (
              <span className="font-medium text-foreground" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="hover:text-foreground">
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
