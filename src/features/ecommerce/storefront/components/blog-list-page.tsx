import { getFormatter, getTranslations } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import type { StorefrontBlogPost, StorefrontPaginated } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { StorePagination } from '@/features/ecommerce/storefront/components/store-pagination';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import { Link } from '@/i18n/navigation';
import type { StorefrontLocale } from '@/i18n/routing';

export async function BlogListPage({
  page,
  result,
  locale,
}: {
  page: number;
  result: StorefrontPaginated<StorefrontBlogPost>;
  locale: StorefrontLocale;
}) {
  const t = await getTranslations('storefront');
  const format = await getFormatter();
  const posts = result.items;

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(t('blog.title'), '/store/blog', locale)} />
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('blog.title'), path: '/store/blog' },
        ]}
      />
      <h1 className="font-arabic-display text-2xl font-bold text-foreground">{t('blog.title')}</h1>

      {posts.length === 0 ? (
        <StoreEmptyState icon={Newspaper} title={t('blog.noPosts')} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-elevated"
            >
              <div className="flex flex-1 flex-col gap-3 p-5">
                <time dateTime={post.publishedAt} className="text-xs text-muted-foreground">
                  {format.dateTime(new Date(post.publishedAt), { dateStyle: 'medium' })}
                </time>
                <h2 className="text-base font-semibold text-foreground">
                  <Link href={`/store/blog/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <Link href={`/store/blog/${post.slug}`} className="mt-auto text-sm font-medium text-primary hover:underline">
                  {t('blog.readMore')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <StorePagination basePath="/store/blog" page={page} totalPages={result.pagination.totalPages} />
    </div>
  );
}
