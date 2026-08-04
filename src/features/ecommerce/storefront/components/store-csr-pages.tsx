'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { notFound, useRouter } from 'next/navigation';
import { AboutPage } from '@/features/ecommerce/storefront/components/about-page';
import { BrandDetailPage } from '@/features/ecommerce/storefront/components/brand-detail-page';
import { BrandsListPage } from '@/features/ecommerce/storefront/components/brands-list-page';
import { CatalogTagPage } from '@/features/ecommerce/storefront/components/catalog-tag-page';
import { CategoriesListPage } from '@/features/ecommerce/storefront/components/categories-list-page';
import { CategoryDetailPage } from '@/features/ecommerce/storefront/components/category-detail-page';
import { ContactPage } from '@/features/ecommerce/storefront/components/contact-page';
import { FaqPage } from '@/features/ecommerce/storefront/components/faq-page';
import { LegalPage } from '@/features/ecommerce/storefront/components/legal-page';
import { ProductDetailPage } from '@/features/ecommerce/storefront/components/product-detail-page';
import { ProductsBrowsePage } from '@/features/ecommerce/storefront/components/products-browse-page';
import { StoreCheckoutPage } from '@/features/ecommerce/storefront/components/checkout/store-checkout-page';
import { StoreCsrError, StoreCsrLoading } from '@/features/ecommerce/storefront/components/store-csr-status';
import { StoreHomePageView } from '@/features/ecommerce/storefront/components/store-home-page';
import { StoreOrderTrackingPage } from '@/features/ecommerce/storefront/components/orders/store-order-tracking-page';
import { clientStorefrontData } from '@/features/ecommerce/storefront/lib/client-storefront-data';
import type { LegalPageSlug } from '@/features/ecommerce/storefront/domain/content';
import type { StorefrontCustomerOrder } from '@/features/ecommerce/storefront/domain/checkout';
import type {
  StorefrontAboutContent,
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
  StorefrontContactContent,
  StorefrontFaqItem,
  StorefrontLegalPage,
  StorefrontPaginated,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontPageView } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { StorefrontLocale } from '@/i18n/routing';

function useCsrLoad<T>(loader: (locale: StorefrontLocale) => Promise<T>, deps: React.DependencyList = []) {
  const locale = useLocale() as StorefrontLocale;
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await loader(locale);
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, [locale, ...deps]);

  return { data, error, loading, locale };
}

export function StoreHomePageCsr() {
  const { data, error, loading } = useCsrLoad(async (locale) => {
    const config = await clientStorefrontData.getConfig(locale);
    if (!config) throw new Error('Store config not found');
    const page = await clientStorefrontData.getHomepage(locale, config.seo.homeTitle);
    if (!page) throw new Error('Homepage not found');
    return { config, page } as { config: StorefrontCompanyConfig; page: StorefrontPageView };
  });

  if (loading) return <StoreCsrLoading />;
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <StoreHomePageView page={data.page} config={data.config} />;
}

export function ProductsBrowsePageCsr({
  page,
  categorySlug,
  tag,
  sort,
}: {
  page: number;
  categorySlug?: string;
  tag?: string;
  sort?: string;
}) {
  const { data, error, loading } = useCsrLoad(
    async (locale) => {
      const [config, categoriesResult] = await Promise.all([
        clientStorefrontData.getConfig(locale),
        clientStorefrontData.getCategories(locale, { limit: 50 }),
      ]);
      if (!config) throw new Error('Store config not found');
      const categories = categoriesResult.items;
      const activeCategory = categorySlug
        ? categories.find((item) => item.slug === categorySlug)
        : undefined;

      const base = { page, limit: 15, categoryId: activeCategory?.id, tag };
      const query =
        sort === 'newest'
          ? { ...base, sort: 'createdAt' as const, sortDirection: 'desc' as const }
          : sort === 'price-asc'
            ? { ...base, sort: 'price' as const, sortDirection: 'asc' as const }
            : sort === 'price-desc'
              ? { ...base, sort: 'price' as const, sortDirection: 'desc' as const }
              : sort === 'best-sellers'
                ? { ...base, tag: tag ?? 'best-seller' }
                : base;

      const productsResult = await clientStorefrontData.getProducts(locale, query);
      return { config, categories, productsResult };
    },
    [page, categorySlug, tag, sort],
  );

  if (loading) return <StoreCsrLoading />;
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;

  return (
    <ProductsBrowsePage
      page={page}
      categorySlug={categorySlug}
      tag={tag}
      sort={sort}
      categories={data.categories}
      secondaryNavigation={data.config.secondaryNavigation}
      storePages={data.config.storePages}
      productsResult={data.productsResult}
    />
  );
}

export function ProductDetailPageCsr({ slug }: { slug: string }) {
  const { data, error, loading } = useCsrLoad(
    async (locale) => {
      const product = await clientStorefrontData.getProductBySlug(locale, slug);
      if (!product) throw new Error('NOT_FOUND');
      const [category, related] = await Promise.all([
        product.categoryId
          ? clientStorefrontData.getCategoryById(locale, product.categoryId)
          : Promise.resolve(null),
        clientStorefrontData.getProducts(locale, { tag: 'best-seller', limit: 10 }),
      ]);
      return { product, category, relatedProducts: related.items };
    },
    [slug],
  );

  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') {
    notFound();
  }
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;

  return (
    <ProductDetailPage
      product={data.product}
      category={data.category}
      relatedProducts={data.relatedProducts}
    />
  );
}

export function BrandsListPageCsr() {
  const { data, error, loading } = useCsrLoad(async (locale) => {
    const result = await clientStorefrontData.getBrands(locale, { limit: 50 });
    return result.items as StorefrontBrand[];
  });
  if (loading) return <StoreCsrLoading />;
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <BrandsListPage brands={data} />;
}

export function BrandDetailPageCsr({ slug }: { slug: string }) {
  const { data, error, loading } = useCsrLoad(
    async (locale) => {
      const brand = await clientStorefrontData.getBrandBySlug(locale, slug);
      if (!brand) throw new Error('NOT_FOUND');
      const productsResult = await clientStorefrontData.getProducts(locale, {
        brandId: brand.id,
        limit: 24,
      });
      return { brand, products: productsResult.items as StorefrontProduct[] };
    },
    [slug],
  );
  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') notFound();
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <BrandDetailPage brand={data.brand} products={data.products} />;
}

export function CategoriesListPageCsr() {
  const { data, error, loading } = useCsrLoad(async (locale) => {
    const result = await clientStorefrontData.getCategories(locale, { limit: 50 });
    return result.items as StorefrontCategory[];
  });
  if (loading) return <StoreCsrLoading />;
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <CategoriesListPage categories={data} />;
}

export function CategoryDetailPageCsr({ slug, page }: { slug: string; page: number }) {
  const { data, error, loading } = useCsrLoad(
    async (locale) => {
      const category = await clientStorefrontData.getCategoryBySlug(locale, slug);
      if (!category) throw new Error('NOT_FOUND');
      const [productsResult, categoriesResult] = await Promise.all([
        clientStorefrontData.getProducts(locale, {
          categoryId: category.id,
          page,
          limit: 12,
        }),
        clientStorefrontData.getCategories(locale, { limit: 200 }),
      ]);
      const subcategories = categoriesResult.items
        .filter((item) => item.parentId === category.id)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      return {
        category,
        productsResult: productsResult as StorefrontPaginated<StorefrontProduct>,
        subcategories,
      };
    },
    [slug, page],
  );
  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') notFound();
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return (
    <CategoryDetailPage
      category={data.category}
      page={page}
      productsResult={data.productsResult}
      subcategories={data.subcategories}
    />
  );
}

export function CatalogTagPageCsr({
  tag,
  page,
  titleKey,
  descriptionKey,
  basePath,
  storePageKey,
}: {
  tag: string;
  page: number;
  titleKey: 'offers.title' | 'wholesale.title';
  descriptionKey: 'offers.description' | 'wholesale.description';
  basePath: '/store/offers' | '/store/wholesale';
  storePageKey: 'offers' | 'wholesale';
}) {
  const t = useTranslations('storefront');
  const router = useRouter();
  const { data, error, loading } = useCsrLoad(
    async (locale) => {
      const [config, productsResult] = await Promise.all([
        clientStorefrontData.getConfig(locale),
        clientStorefrontData.getProducts(locale, { page, limit: 15, tag }),
      ]);
      if (!config) throw new Error('Store config not found');
      if (!config.storePages[storePageKey]) throw new Error('NOT_FOUND');
      return { productsResult };
    },
    [tag, page, storePageKey],
  );

  React.useEffect(() => {
    if (error === 'NOT_FOUND') router.replace('/store');
  }, [error, router]);

  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') return <StoreCsrLoading />;
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;

  return (
    <CatalogTagPage
      title={t(titleKey)}
      description={t(descriptionKey)}
      basePath={basePath}
      page={page}
      productsResult={data.productsResult}
    />
  );
}

export function AboutPageCsr() {
  const { data, error, loading } = useCsrLoad(async (locale) => {
    const content = await clientStorefrontData.getAbout(locale);
    if (!content) throw new Error('NOT_FOUND');
    return content as StorefrontAboutContent;
  });
  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') notFound();
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <AboutPage content={data} />;
}

export function FaqPageCsr() {
  const { data, error, loading } = useCsrLoad(async (locale) => {
    return (await clientStorefrontData.getFaq(locale)) as StorefrontFaqItem[];
  });
  if (loading) return <StoreCsrLoading />;
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <FaqPage items={data} />;
}

export function ContactPageCsr() {
  const { data, error, loading } = useCsrLoad(async (locale) => {
    const [content, config] = await Promise.all([
      clientStorefrontData.getContact(locale),
      clientStorefrontData.getConfig(locale),
    ]);
    if (!content || !config) throw new Error('NOT_FOUND');
    return { content: content as StorefrontContactContent, config };
  });
  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') notFound();
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <ContactPage content={data.content} config={data.config} />;
}

export function LegalPageCsr({ slug }: { slug: LegalPageSlug }) {
  const { data, error, loading, locale } = useCsrLoad(
    async (loc) => {
      const page = await clientStorefrontData.getLegal(loc, slug);
      if (!page) throw new Error('NOT_FOUND');
      return page as StorefrontLegalPage;
    },
    [slug],
  );
  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') notFound();
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <LegalPage page={data} locale={locale} />;
}

export function StoreCheckoutPageCsr() {
  const { data, error, loading } = useCsrLoad(async (locale) => {
    const config = await clientStorefrontData.getConfig(locale);
    if (!config) throw new Error('Store config not found');
    return config;
  });
  if (loading) return <StoreCsrLoading />;
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <StoreCheckoutPage config={data} />;
}

export function StoreOrderTrackingPageCsr({
  orderNumber,
  phone,
}: {
  orderNumber: string;
  phone?: string | null;
}) {
  const { data, error, loading } = useCsrLoad(
    async () => {
      const order = await clientStorefrontData.getOrderByNumber(orderNumber, phone);
      if (!order) throw new Error('NOT_FOUND');
      return order as StorefrontCustomerOrder;
    },
    [orderNumber, phone],
  );
  if (loading) return <StoreCsrLoading />;
  if (error === 'NOT_FOUND') notFound();
  if (error || !data) return <StoreCsrError message={error ?? undefined} />;
  return <StoreOrderTrackingPage order={data} />;
}
