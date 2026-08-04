import type { Metadata } from 'next';
import { BlogDetailPage } from '@/features/ecommerce/storefront/components/blog-detail-page';
import { blogPostMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontBlogPostBySlug } from '@/features/ecommerce/storefront/lib/loaders/content-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getStorefrontBlogPostBySlug(slug);
  const config = await getStorefrontCompanyConfig();
  return blogPostMetadata(post, config, locale as StorefrontLocale);
}

export default async function Page({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const [post, config] = await Promise.all([getStorefrontBlogPostBySlug(slug), getStorefrontCompanyConfig()]);
  return <BlogDetailPage post={post} config={config} locale={locale as StorefrontLocale} />;
}
