import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';

const DEMO_COMPANY_SEED: CompanyConfigRecord = {
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
      ar: 'نضارة — مكياج، عناية بالبشرة، شعر، وأدوات تجميل بتوصيل سريع داخل اليمن.',
      en: 'Nadara Beauty — makeup, skincare, haircare & beauty tools with fast delivery across Yemen.',
    },
    productsTitle: { ar: 'كل المنتجات', en: 'All products' },
    productsDescription: {
      ar: 'تصفّح منتجات التجميل والعناية بالبشرة والشعر من أشهر العلامات.',
      en: 'Browse cosmetics, skincare, and haircare from top beauty brands.',
    },
    defaultOgImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80',
  },
  contact: {
    phone: '+967 770 000 000',
    email: 'support@nadara-beauty.example',
    address: 'Sanaa, Yemen',
  },
  social: {
    instagram: 'https://instagram.com/nadarabeauty',
    twitter: 'https://twitter.com/nadarabeauty',
    whatsapp: 'https://wa.me/967770000000',
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
  announcement: {
    enabled: true,
    message: {
      ar: 'شحن مجاني للطلبات فوق 200 ر.ي داخل اليمن',
      en: 'Free shipping on orders over YER 200 across Yemen',
    },
    href: '/store/offers',
    dismissible: true,
  },
  defaultLocale: 'ar',
  currency: 'YER',
  timezone: 'Asia/Aden',
};

/** Shared across Server Actions + RSC (avoids duplicate module instances). */
const globalForCompany = globalThis as typeof globalThis & {
  __ecommerceCompanyConfigs?: Record<string, CompanyConfigRecord>;
};

const COMPANY_CONFIGS: Record<string, CompanyConfigRecord> =
  globalForCompany.__ecommerceCompanyConfigs ??
  (globalForCompany.__ecommerceCompanyConfigs = {
    'demo-company': JSON.parse(JSON.stringify(DEMO_COMPANY_SEED)) as CompanyConfigRecord,
  });

/** Migrate leftover Saudi demo values to Yemen after seed updates (HMR-safe). */
if (COMPANY_CONFIGS['demo-company']) {
  const demo = COMPANY_CONFIGS['demo-company']!;
  const needsYemenMigrate =
    demo.currency === 'SAR' ||
    demo.contact.phone.includes('966') ||
    demo.contact.address.toLowerCase().includes('saudi') ||
    demo.contact.address.toLowerCase().includes('riyadh');

  demo.currency = DEMO_COMPANY_SEED.currency;
  demo.timezone = DEMO_COMPANY_SEED.timezone;

  if (needsYemenMigrate) {
    demo.contact = JSON.parse(JSON.stringify(DEMO_COMPANY_SEED.contact)) as CompanyConfigRecord['contact'];
    demo.social = {
      ...demo.social,
      whatsapp: DEMO_COMPANY_SEED.social.whatsapp,
    };
    demo.seo = {
      ...demo.seo,
      homeDescription: { ...DEMO_COMPANY_SEED.seo.homeDescription },
    };
    demo.announcement = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.announcement),
    ) as CompanyConfigRecord['announcement'];
  }
}

export function getCompanyConfigMock(companyId: string): CompanyConfigRecord | null {
  const record = COMPANY_CONFIGS[companyId];
  if (!record) return null;
  const cloned = JSON.parse(JSON.stringify(record)) as CompanyConfigRecord;
  if (!cloned.announcement) {
    cloned.announcement = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.announcement),
    ) as CompanyConfigRecord['announcement'];
  }
  return cloned;
}

/** Persists company CMS config in the same in-memory store the storefront reads. */
export function saveCompanyConfigMock(record: CompanyConfigRecord): CompanyConfigRecord {
  const next = JSON.parse(JSON.stringify(record)) as CompanyConfigRecord;
  if (!next.announcement) {
    next.announcement = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.announcement),
    ) as CompanyConfigRecord['announcement'];
  }
  COMPANY_CONFIGS[record.id] = next;
  return JSON.parse(JSON.stringify(COMPANY_CONFIGS[record.id])) as CompanyConfigRecord;
}
