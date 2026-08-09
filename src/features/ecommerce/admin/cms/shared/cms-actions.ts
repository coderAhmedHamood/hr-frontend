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
import type { AdminContactMessagesQuery } from '@/features/ecommerce/shared/lib/api/store-content-api';
import { ApiError } from '@/features/hr/lib/api/client';
import { sanitizeRichHtml } from '@/shared/lib/sanitize-rich-html';
import { routing } from '@/i18n/routing';

/** Invalidate storefront caches so CMS saves appear on the live store. */
function revalidateStorefront() {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/store`, 'layout');
    revalidatePath(`/${locale}/store`);
  }
}

function toActionError(error: unknown): Error {
  if (error instanceof ApiError) {
    return new Error(error.message || `HTTP ${error.status}`);
  }
  if (error instanceof Error) return error;
  return new Error('Unexpected CMS error');
}

// ── Page builder (homepage / banners) ────────────────────────────────────────

export async function getCmsPageRecord(
  companyId: string,
  pageType: PageType,
): Promise<PageRecord | null> {
  try {
    return await storefrontPageRepository.getRecordByPageType(companyId, pageType);
  } catch (error) {
    // Settings (and soft UIs) only need pages when the role can read them — do not 500 the RSC action.
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return null;
    }
    throw toActionError(error);
  }
}

export async function saveCmsPageRecord(record: PageRecord): Promise<PageRecord> {
  try {
    const saved = await storefrontPageRepository.saveRecord(record);
    revalidateStorefront();
    return saved;
  } catch (error) {
    throw toActionError(error);
  }
}

// ── Company config (nav / footer / settings / SEO) ────────────────────────────

export async function getCmsCompanyRecord(companyId: string): Promise<CompanyConfigRecord | null> {
  return storefrontCompanyRepository.getRecordByCompanyId(companyId);
}

export async function saveCmsCompanyRecord(record: CompanyConfigRecord): Promise<CompanyConfigRecord> {
  try {
    const saved = await storefrontCompanyRepository.saveRecord(record);
    revalidateStorefront();
    return saved;
  } catch (error) {
    throw toActionError(error);
  }
}

// ── Content (pages / FAQ) ─────────────────────────────────────────────────────

export async function getCmsContentBundle(companyId: string): Promise<StorefrontContentBundle | null> {
  return storefrontContentRepository.getContentBundle(companyId);
}

export async function saveCmsAbout(
  companyId: string,
  about: AboutPageContent,
): Promise<AboutPageContent> {
  try {
    const saved = await storefrontContentRepository.saveAbout(companyId, about);
    revalidateStorefront();
    return saved;
  } catch (error) {
    throw toActionError(error);
  }
}

export async function saveCmsContact(
  companyId: string,
  contact: ContactPageContent,
): Promise<ContactPageContent> {
  try {
    const saved = await storefrontContentRepository.saveContact(companyId, contact);
    revalidateStorefront();
    return saved;
  } catch (error) {
    throw toActionError(error);
  }
}

export async function saveCmsFaq(companyId: string, faq: FaqItem[]): Promise<FaqItem[]> {
  try {
    const saved = await storefrontContentRepository.saveFaq(companyId, faq);
    revalidateStorefront();
    return saved;
  } catch (error) {
    throw toActionError(error);
  }
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
  try {
    const saved = await storefrontContentRepository.saveLegalPage(companyId, sanitized);
    revalidateStorefront();
    return saved;
  } catch (error) {
    throw toActionError(error);
  }
}

// ── Contact messages inbox ────────────────────────────────────────────────────

export async function listCmsContactMessages(
  companyId: string,
  query?: AdminContactMessagesQuery,
) {
  try {
    const { fetchAdminContactMessages } = await import(
      '@/features/ecommerce/shared/lib/api/store-content-api'
    );
    return await fetchAdminContactMessages(companyId, query);
  } catch (error) {
    throw toActionError(error);
  }
}
