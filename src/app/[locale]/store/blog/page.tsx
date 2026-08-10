import type { Metadata } from 'next';
import { BlogListPage } from '@/features/ecommerce/storefront/components/blog-list-page';
import { blogMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontBlogPosts } from '@/features/ecommerce/storefront/lib/loaders/content-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type SearchParams = Promise<{ page?: string }>;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return await blogMetadata(config, locale as StorefrontLocale);
}

export default async function Page({ params, searchParams }: Props & { searchParams: SearchParams }) {
  const { locale } = await params;
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);
  const result = await getStorefrontBlogPosts(pageNumber);
  return <BlogListPage page={pageNumber} result={result} locale={locale as StorefrontLocale} />;
}
