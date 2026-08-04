import {
  DEFAULT_MOBILE_TABS,
  DEFAULT_STORE_PAGES_VISIBILITY,
  normalizeAnnouncementBar,
  normalizeSocialLinks,
  normalizeStorePagesVisibility,
  type CompanyConfigRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { DEFAULT_STOREFRONT_TYPOGRAPHY } from '@/features/ecommerce/storefront/lib/storefront-fonts';
import {
  LEGACY_STOREFRONT_COMPANY_ID,
  STOREFRONT_FALLBACK_COMPANY_ID,
} from '@/features/ecommerce/storefront/lib/storefront-company';

const DEMO_COMPANY_SEED: CompanyConfigRecord = {
  id: STOREFRONT_FALLBACK_COMPANY_ID,
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
    keywords: [
      'تجميل',
      'مكياج',
      'عناية بالبشرة',
      'نضارة',
      'أدوات تجميل',
      'توصيل اليمن',
    ],
  },
  contact: {
    phone: '+967 770 000 000',
    email: 'support@nadara-beauty.example',
    address: 'Sanaa, Yemen',
  },
  social: {
    instagram: { url: 'https://instagram.com/nadarabeauty', enabled: true },
    twitter: { url: 'https://twitter.com/nadarabeauty', enabled: true },
    whatsapp: { url: 'https://wa.me/967770000000', enabled: true },
    facebook: { url: '', enabled: false },
    tiktok: { url: '', enabled: false },
    youtube: { url: '', enabled: false },
    snapchat: { url: '', enabled: false },
    linkedin: { url: '', enabled: false },
  },
  theme: {
    primary: '340 42% 32%',
    secondary: '18 45% 68%',
    accent: '340 28% 94%',
  },
  typography: { ...DEFAULT_STOREFRONT_TYPOGRAPHY },
  navigation: [
    { label: { ar: 'الرئيسية', en: 'Home' }, href: '/store' },
    { label: { ar: 'المنتجات', en: 'Products' }, href: '/store/products' },
    { label: { ar: 'العروض', en: 'Offers' }, href: '/store/offers' },
    { label: { ar: 'أسعار الجملة', en: 'Wholesale' }, href: '/store/wholesale' },
    { label: { ar: 'من نحن', en: 'About' }, href: '/store/about' },
    { label: { ar: 'تواصل', en: 'Contact' }, href: '/store/contact' },
  ],
  secondaryNavigation: [
    { label: { ar: 'منطقة العروض', en: 'Offers zone' }, href: '/store/offers', highlight: true },
    { label: { ar: 'أسعار الجملة', en: 'Wholesale' }, href: '/store/wholesale' },
  ],
  footer: {
    copyrightOwnerName: { ar: 'نضارة', en: 'Nadara Beauty' },
    tagline: {
      ar: 'تسوّق بثقة — منتجات مختارة وتجربة عربية / إنجليزية سلسة.',
      en: 'Shop with confidence — curated products and a smooth Arabic / English experience.',
    },
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
  mobileTabs: DEFAULT_MOBILE_TABS.map((tab) => ({ ...tab, label: { ...tab.label } })),
  announcement: {
    enabled: true,
    dismissible: true,
    scrolling: true,
    speedMs: 28_000,
    items: [
      {
        id: 'ann-free-shipping',
        enabled: true,
        message: {
          ar: 'شحن مجاني للطلبات فوق 200 ر.ي داخل اليمن',
          en: 'Free shipping on orders over YER 200 across Yemen',
        },
        href: '/store/offers',
      },
      {
        id: 'ann-new-arrivals',
        enabled: true,
        message: {
          ar: 'وصل حديثاً — تصفح أحدث المنتجات',
          en: 'Just arrived — browse the latest products',
        },
        href: '/store/products',
      },
      {
        id: 'ann-support',
        enabled: true,
        message: {
          ar: 'خدمة العملاء متاحة يومياً عبر واتساب',
          en: 'Customer support available daily on WhatsApp',
        },
        href: null,
      },
    ],
  },
  checkout: {
    cities: [
      'صنعاء',
      'عدن',
      'تعز',
      'الحديدة',
      'إب',
      'ذمار',
      'المكلا',
      'سيئون',
      'حجة',
      'صعدة',
      'مأرب',
      'البيضاء',
      'لحج',
      'أبين',
      'الضالع',
      'شبوة',
      'المحويت',
      'عمران',
    ],
    defaultCity: 'صنعاء',
    freeShippingThreshold: 200,
    standardShippingFee: 25,
    paymentMethods: ['cash_on_delivery', 'card'],
  },
  storePages: { ...DEFAULT_STORE_PAGES_VISIBILITY },
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
    [STOREFRONT_FALLBACK_COMPANY_ID]: JSON.parse(JSON.stringify(DEMO_COMPANY_SEED)) as CompanyConfigRecord,
  });

// HMR: move legacy `demo-company` seed onto the UUID key.
if (COMPANY_CONFIGS[LEGACY_STOREFRONT_COMPANY_ID] && !COMPANY_CONFIGS[STOREFRONT_FALLBACK_COMPANY_ID]) {
  const legacy = COMPANY_CONFIGS[LEGACY_STOREFRONT_COMPANY_ID]!;
  legacy.id = STOREFRONT_FALLBACK_COMPANY_ID;
  COMPANY_CONFIGS[STOREFRONT_FALLBACK_COMPANY_ID] = legacy;
  delete COMPANY_CONFIGS[LEGACY_STOREFRONT_COMPANY_ID];
} else if (COMPANY_CONFIGS[LEGACY_STOREFRONT_COMPANY_ID]) {
  delete COMPANY_CONFIGS[LEGACY_STOREFRONT_COMPANY_ID];
}

/** Migrate leftover Saudi demo values to Yemen after seed updates (HMR-safe). */
if (COMPANY_CONFIGS[STOREFRONT_FALLBACK_COMPANY_ID]) {
  const demo = COMPANY_CONFIGS[STOREFRONT_FALLBACK_COMPANY_ID]!;
  demo.id = STOREFRONT_FALLBACK_COMPANY_ID;
  const needsYemenMigrate =
    demo.currency === 'SAR' ||
    demo.contact.phone?.includes('966') === true ||
    demo.contact.address?.toLowerCase().includes('saudi') === true ||
    demo.contact.address?.toLowerCase().includes('riyadh') === true;

  demo.currency = DEMO_COMPANY_SEED.currency;
  demo.timezone = DEMO_COMPANY_SEED.timezone;

  if (needsYemenMigrate) {
    demo.contact = JSON.parse(JSON.stringify(DEMO_COMPANY_SEED.contact)) as CompanyConfigRecord['contact'];
    demo.social = normalizeSocialLinks({
      ...demo.social,
      whatsapp: DEMO_COMPANY_SEED.social.whatsapp,
    });
    demo.seo = {
      ...demo.seo,
      homeDescription: { ...DEMO_COMPANY_SEED.seo.homeDescription },
      keywords: demo.seo.keywords ?? DEMO_COMPANY_SEED.seo.keywords,
    };
    demo.announcement = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.announcement),
    ) as CompanyConfigRecord['announcement'];
  }

  if (!demo.checkout) {
    demo.checkout = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.checkout),
    ) as CompanyConfigRecord['checkout'];
  }
  if (!demo.secondaryNavigation?.length) {
    demo.secondaryNavigation = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.secondaryNavigation),
    ) as CompanyConfigRecord['secondaryNavigation'];
  }
  demo.storePages = normalizeStorePagesVisibility(demo.storePages);
}

export function getCompanyConfigMock(companyId: string): CompanyConfigRecord | null {
  const record = COMPANY_CONFIGS[companyId];
  if (!record) return null;
  const cloned = JSON.parse(JSON.stringify(record)) as CompanyConfigRecord;
  if (!cloned.announcement) {
    cloned.announcement = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.announcement),
    ) as CompanyConfigRecord['announcement'];
  } else {
    cloned.announcement = normalizeAnnouncementBar(cloned.announcement);
  }
  if (!cloned.checkout) {
    cloned.checkout = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.checkout),
    ) as CompanyConfigRecord['checkout'];
  }
  if (!cloned.secondaryNavigation) {
    cloned.secondaryNavigation = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.secondaryNavigation),
    ) as CompanyConfigRecord['secondaryNavigation'];
  }
  cloned.storePages = normalizeStorePagesVisibility(cloned.storePages);
  cloned.social = normalizeSocialLinks(cloned.social);
  if (!cloned.seo.keywords) {
    cloned.seo.keywords = [];
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
  } else {
    next.announcement = normalizeAnnouncementBar(next.announcement);
  }
  if (!next.checkout) {
    next.checkout = JSON.parse(
      JSON.stringify(DEMO_COMPANY_SEED.checkout),
    ) as CompanyConfigRecord['checkout'];
  }
  if (!next.secondaryNavigation) {
    next.secondaryNavigation = [];
  }
  next.storePages = normalizeStorePagesVisibility(next.storePages);
  next.social = normalizeSocialLinks(next.social);
  next.seo.keywords = (next.seo.keywords ?? [])
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  COMPANY_CONFIGS[record.id] = next;
  return JSON.parse(JSON.stringify(COMPANY_CONFIGS[record.id])) as CompanyConfigRecord;
}
