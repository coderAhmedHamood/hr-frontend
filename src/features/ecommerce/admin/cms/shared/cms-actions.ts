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

function actionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || `HTTP ${error.status}`;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Unexpected CMS error';
}

function toActionError(error: unknown): Error {
  return new Error(actionErrorMessage(error));
}

// ── Page builder (homepage / banners) ────────────────────────────────────────

/**
 * Failures are returned, not thrown. Next.js replaces a thrown server-action
 * error in production with "An error occurred in the Server Components render",
 * which hides the real cause from the page that called the action.
 */
export type CmsPageLoadResult =
  | { ok: true; record: PageRecord | null }
  | { ok: false; message: string };

export type CmsPageSaveResult =
  | { ok: true; record: PageRecord }
  | { ok: false; message: string };

export async function getCmsPageRecord(
  companyId: string,
  pageType: PageType,
): Promise<CmsPageLoadResult> {
  try {
    return {
      ok: true,
      record: await storefrontPageRepository.getRecordByPageType(companyId, pageType),
    };
  } catch (error) {
    // Settings (and soft UIs) only need pages when the role can read them — do not 500 the RSC action.
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return { ok: true, record: null };
    }
    return { ok: false, message: actionErrorMessage(error) };
  }
}

export async function saveCmsPageRecord(record: PageRecord): Promise<CmsPageSaveResult> {
  try {
    const saved = await storefrontPageRepository.saveRecord(record);
    revalidateStorefront();
    return { ok: true, record: saved };
  } catch (error) {
    return { ok: false, message: actionErrorMessage(error) };
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
