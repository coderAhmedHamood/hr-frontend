import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';
import { buildCategoryTree } from '@/features/ecommerce/storefront/utils/category-tree';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

export async function StorePlpSidebar({
  categories,
  activeCategorySlug,
  activeTag,
}: {
  categories: StorefrontCategory[];
  activeCategorySlug?: string;
  activeTag?: string;
}) {
  const t = await getTranslations('storefront');
  const { roots, childrenByParent } = buildCategoryTree(categories);

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-36 flex flex-col gap-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t('products.filters')}</h2>
          <nav className="flex flex-col gap-1" aria-label={t('nav.categories')}>
            <Link
              href="/store/products"
              prefetch={false}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                !activeCategorySlug && !activeTag ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {t('products.all')}
            </Link>
            {roots.map((root) => {
              const subs = childrenByParent[root.id] ?? [];
              const isActive = activeCategorySlug === root.slug || subs.some((s) => s.slug === activeCategorySlug);
              return (
                <div key={root.id}>
                  <Link
                    href={`/store/products?category=${root.slug}`}
                    prefetch={false}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm transition-colors',
                      isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {root.name}
                  </Link>
                  {subs.length > 0 && isActive ? (
                    <div className="ms-3 flex flex-col gap-0.5 border-s border-border ps-2">
                      {subs.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/store/products?category=${sub.slug}`}
                          prefetch={false}
                          className={cn(
                            'rounded-md px-2 py-1.5 text-xs transition-colors',
                            activeCategorySlug === sub.slug ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="mb-1 text-sm font-semibold text-foreground">{t('nav.offersZone')}</h3>
          <Link
            href="/store/offers"
            prefetch={false}
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors',
              activeTag === 'deals' ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {t('offers.title')}
          </Link>
          <Link
            href="/store/wholesale"
            prefetch={false}
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors',
              activeTag === 'wholesale' ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {t('wholesale.title')}
          </Link>
        </div>
      </div>
    </aside>
  );
}
