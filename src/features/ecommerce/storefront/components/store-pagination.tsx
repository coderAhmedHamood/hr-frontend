import { getTranslations } from 'next-intl/server';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type Props = {
  basePath: string;
  /** Extra query params to preserve across page links (e.g. category filter). */
  query?: Record<string, string | undefined>;
  page: number;
  totalPages: number;
};

function hrefForPage(basePath: string, query: Record<string, string | undefined> | undefined, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const navBtnClass =
  'flex h-9 w-9 items-center justify-center rounded-md border border-border text-sm hover:bg-accent';

/** Plain crawlable `<a>` pagination links — never JS-only, per the SEO contract's Pagination SEO rule. */
export async function StorePagination({ basePath, query, page, totalPages }: Props) {
  const t = await getTranslations('storefront');

  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="flex items-center justify-center gap-2" aria-label={t('a11y.pagination')}>
      {prevDisabled ? (
        <span className={cn(navBtnClass, 'pointer-events-none opacity-40')} aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link href={hrefForPage(basePath, query, page - 1)} className={navBtnClass} aria-label={t('a11y.paginationPrevious')}>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
      <span className="px-2 text-sm text-muted-foreground" aria-current="page">
        {t('a11y.pageOf', { page, total: totalPages })}
      </span>
      {nextDisabled ? (
        <span className={cn(navBtnClass, 'pointer-events-none opacity-40')} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
        </span>
      ) : (
        <Link href={hrefForPage(basePath, query, page + 1)} className={navBtnClass} aria-label={t('a11y.paginationNext')}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
