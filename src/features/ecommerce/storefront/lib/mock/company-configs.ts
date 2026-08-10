import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';

const COMPANY_CONFIGS: Record<string, CompanyConfigRecord> = {
  'demo-company': {
    id: 'demo-company',
    name: { ar: 'نضارة', en: 'Nadara Beauty' },
    logoUrl: null,
    faviconUrl: null,
    seo: {
      homeTitle: {
        ar: 'تسوّق أدوات التجميل والعناية بالبشرة أونلاين',
        en: 'Shop cosmetics & skincare online',
      },
      homeDescription: {
        ar: 'نضارة — مكياج، عناية بالبشرة، شعر، وأدوات تجميل بتوصيل سريع داخل السعودية.',
        en: 'Nadara Beauty — makeup, skincare, haircare & beauty tools with fast delivery across Saudi Arabia.',
      },
      productsTitle: { ar: 'كل المنتجات', en: 'All products' },
      productsDescription: {
        ar: 'تصفّح منتجات التجميل والعناية بالبشرة والشعر من أشهر العلامات.',
        en: 'Browse cosmetics, skincare, and haircare from top beauty brands.',
      },
      defaultOgImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80',
    },
    contact: {
      phone: '+966 50 000 0000',
      email: 'support@nadara-beauty.example',
      address: 'Riyadh, Saudi Arabia',
    },
    social: {
      instagram: 'https://instagram.com/nadarabeauty',
      twitter: 'https://twitter.com/nadarabeauty',
      whatsapp: 'https://wa.me/966500000000',
    },
    theme: {
      primary: '340 42% 32%',
      secondary: '18 45% 68%',
      accent: '340 28% 94%',
    },
    navigation: [
      { label: { ar: 'الرئيسية', en: 'Home' }, href: '/store' },
      { label: { ar: 'المنتجات', en: 'Products' }, href: '/store/products' },
      { label: { ar: 'العروض', en: 'Offers' }, href: '/store/offers' },
      { label: { ar: 'أسعار الجملة', en: 'Wholesale' }, href: '/store/wholesale' },
      { label: { ar: 'من نحن', en: 'About' }, href: '/store/about' },
      { label: { ar: 'تواصل', en: 'Contact' }, href: '/store/contact' },
    ],
    secondaryNavigation: [],
    footer: {
      copyrightOwnerName: { ar: 'نضارة', en: 'Nadara Beauty' },
      commercialRegistration: '7014367010',
      linkGroups: [
        {
          id: 'company',
          title: { ar: 'الشركة', en: 'Company' },
          links: [
            { label: { ar: 'من نحن', en: 'About us' }, href: '/store/about' },
            { label: { ar: 'تواصل معنا', en: 'Contact us' }, href: '/store/contact' },
            { label: { ar: 'الشروط والأحكام', en: 'Terms & conditions' }, href: '/store/legal/terms' },
            { label: { ar: 'سياسة الخصوصية', en: 'Privacy policy' }, href: '/store/legal/privacy' },
          ],
        },
        {
          id: 'help',
          title: { ar: 'المساعدة', en: 'Help' },
          links: [
            { label: { ar: 'الأسئلة الشائعة', en: 'FAQ' }, href: '/store/faq' },
            { label: { ar: 'التوصيل والشحن', en: 'Delivery & shipping' }, href: '/store/legal/returns' },
            { label: { ar: 'سياسة الإرجاع', en: 'Returns policy' }, href: '/store/legal/returns' },
          ],
        },
        {
          id: 'shop',
          title: { ar: 'التسوق', en: 'Shop' },
          links: [
            { label: { ar: 'المنتجات', en: 'Products' }, href: '/store/products' },
            { label: { ar: 'العروض', en: 'Offers' }, href: '/store/offers' },
            { label: { ar: 'أسعار الجملة', en: 'Wholesale' }, href: '/store/wholesale' },
            { label: { ar: 'التصنيفات', en: 'Categories' }, href: '/store/categories' },
            { label: { ar: 'العلامات التجارية', en: 'Brands' }, href: '/store/brands' },
            { label: { ar: 'بحث', en: 'Search' }, href: '/store/search' },
          ],
        },
      ],
    },
    defaultLocale: 'ar',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
  },
};

export function getCompanyConfigMock(companyId: string): CompanyConfigRecord | null {
  const record = COMPANY_CONFIGS[companyId];
  return record ? (JSON.parse(JSON.stringify(record)) as CompanyConfigRecord) : null;
}

/** Persists company CMS config in the same in-memory store the storefront reads. */
export function saveCompanyConfigMock(record: CompanyConfigRecord): CompanyConfigRecord {
  COMPANY_CONFIGS[record.id] = JSON.parse(JSON.stringify(record)) as CompanyConfigRecord;
  return JSON.parse(JSON.stringify(COMPANY_CONFIGS[record.id])) as CompanyConfigRecord;
}
