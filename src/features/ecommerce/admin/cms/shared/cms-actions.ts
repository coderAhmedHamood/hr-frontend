'use server';

import { revalidatePath } from 'next/cache';
import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import type {
  AboutPageContent,
  ContactPageContent,
  FaqItem,
  LegalPageContent,
  StorefrontContentBundle,
} from '@/features/ecommerce/storefront/domain/content';
import type { PageRecord } from '@/features/ecommerce/storefront/page-builder/domain/page-records';
import type { PageType } from '@/features/ecommerce/storefront/page-builder/domain/page-types';
import { storefrontCompanyRepository } from '@/features/ecommerce/storefront/lib/repositories/company-repository';
import { storefrontContentRepository } from '@/features/ecommerce/storefront/lib/repositories/content-repository';
import { storefrontPageRepository } from '@/features/ecommerce/storefront/page-builder/lib/repositories/page-repository';
import { sanitizeRichHtml } from '@/shared/lib/sanitize-rich-html';
import { routing } from '@/i18n/routing';

/** Invalidate storefront caches so CMS saves appear on the live store. */
function revalidateStorefront() {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/store`, 'layout');
    revalidatePath(`/${locale}/store`);
  }
}

// ── Page builder (homepage / banners) ────────────────────────────────────────

export async function getCmsPageRecord(
  companyId: string,
  pageType: PageType,
): Promise<PageRecord | null> {
  return storefrontPageRepository.getRecordByPageType(companyId, pageType);
}

export async function saveCmsPageRecord(record: PageRecord): Promise<PageRecord> {
  const saved = await storefrontPageRepository.saveRecord(record);
  revalidateStorefront();
  return saved;
}

// ── Company config (nav / footer / settings / SEO) ────────────────────────────

export async function getCmsCompanyRecord(companyId: string): Promise<CompanyConfigRecord | null> {
  return storefrontCompanyRepository.getRecordByCompanyId(companyId);
}

export async function saveCmsCompanyRecord(record: CompanyConfigRecord): Promise<CompanyConfigRecord> {
  const saved = await storefrontCompanyRepository.saveRecord(record);
  revalidateStorefront();
  return saved;
}

// ── Content (pages / FAQ) ─────────────────────────────────────────────────────

export async function getCmsContentBundle(companyId: string): Promise<StorefrontContentBundle | null> {
  return storefrontContentRepository.getContentBundle(companyId);
}

export async function saveCmsAbout(
  companyId: string,
  about: AboutPageContent,
): Promise<AboutPageContent> {
  const saved = await storefrontContentRepository.saveAbout(companyId, about);
  revalidateStorefront();
  return saved;
}

export async function saveCmsContact(
  companyId: string,
  contact: ContactPageContent,
): Promise<ContactPageContent> {
  const saved = await storefrontContentRepository.saveContact(companyId, contact);
  revalidateStorefront();
  return saved;
}

export async function saveCmsFaq(companyId: string, faq: FaqItem[]): Promise<FaqItem[]> {
  const saved = await storefrontContentRepository.saveFaq(companyId, faq);
  revalidateStorefront();
  return saved;
}

export async function saveCmsLegalPage(
  companyId: string,
  page: LegalPageContent,
): Promise<LegalPageContent> {
  const sanitized: LegalPageContent = {
    ...page,
    body: {
      ar: sanitizeRichHtml(page.body.ar),
      en: sanitizeRichHtml(page.body.en),
    },
    updatedAt: new Date().toISOString(),
  };
  const saved = await storefrontContentRepository.saveLegalPage(companyId, sanitized);
  revalidateStorefront();
  return saved;
}
