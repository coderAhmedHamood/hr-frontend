import { getFormatter, getTranslations } from 'next-intl/server';
import type { StorefrontBlogPost, StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { articleJsonLd, breadcrumbJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import { Link } from '@/i18n/navigation';
import type { StorefrontLocale } from '@/i18n/routing';

export async function BlogDetailPage({
  post,
  config,
  locale,
}: {
  post: StorefrontBlogPost;
  config: StorefrontCompanyConfig;
  locale: StorefrontLocale;
}) {
  const t = await getTranslations('storefront');
  const format = await getFormatter();

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('blog.title'), path: '/store/blog' as const },
    { name: post.title, path: `/store/blog/${post.slug}` as const },
  ];

  return (
    <article className="flex flex-col gap-6">
      <JsonLd data={articleJsonLd(post, config, locale)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />

      <StoreBreadcrumbs items={breadcrumbItems} />

      <header className="max-w-3xl">
        <time dateTime={post.publishedAt} className="text-xs text-muted-foreground">
          {t('blog.publishedAt')} {format.dateTime(new Date(post.publishedAt), { dateStyle: 'medium' })}
        </time>
        <h1 className="mt-2 font-arabic-display text-3xl font-bold text-foreground">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{post.authorName}</p>
      </header>

      <div className="prose prose-sm max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {post.body}
      </div>

      <Link href="/store/blog" className="text-sm font-medium text-primary hover:underline">
        ← {t('blog.backToBlog')}
      </Link>
    </article>
  );
}
