'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/features/hr/lib/api/client';
import {
  DEFAULT_PRINT_TEMPLATE_SETTINGS,
  PRINT_DOCUMENTS,
  type PrintDocumentType,
  type PrintTemplateSettings,
} from '@/features/print-templates/domain/types';

/**
 * Company print templates, on the server (GET/PUT
 * /companies/:id/print-templates): the unified template (`default`) and the
 * document types that have their own. Everyone in the company reads them;
 * company settings editors save them.
 */
type PrintTemplateRow = {
  documentType: PrintDocumentType;
  settings: PrintTemplateSettings;
  updatedAt: string;
};

export type CompanyPrintTemplates = Partial<Record<PrintDocumentType, PrintTemplateSettings>>;

const queryKey = (companyId: string | null | undefined) => ['print-templates', companyId ?? ''];

/** Settings from before the server kept them (this browser only). */
const LEGACY_STORAGE_KEY = 'erp.print-templates.v1';

function readLegacy(companyId: string): PrintTemplateSettings | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { state?: { byCompany?: Record<string, PrintTemplateSettings> } }) : null;
    return parsed?.state?.byCompany?.[companyId] ?? null;
  } catch {
    return null;
  }
}

function dropLegacy(companyId: string): void {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: { byCompany?: Record<string, unknown> } };
    delete parsed.state?.byCompany?.[companyId];
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* nothing to clean */
  }
}

async function fetchPrintTemplates(companyId: string): Promise<CompanyPrintTemplates> {
  const rows = await apiRequest<PrintTemplateRow[]>(`/companies/${companyId}/print-templates`, {
    throwOnError: true,
  });
  const out: CompanyPrintTemplates = {};
  for (const row of rows ?? []) out[row.documentType] = row.settings;
  // A company that set its template in this browser before: moved to the
  // server once (as the unified template), when the user may save it.
  if (!out.default) {
    const legacy = readLegacy(companyId);
    if (legacy) {
      try {
        await savePrintTemplate(companyId, 'default', resolvePrintTemplateSettings(legacy));
        out.default = resolvePrintTemplateSettings(legacy);
        dropLegacy(companyId);
      } catch {
        /* not allowed to save: kept until someone who may opens the settings */
      }
    }
  }
  return out;
}

async function savePrintTemplate(
  companyId: string,
  documentType: PrintDocumentType,
  settings: PrintTemplateSettings | null,
): Promise<void> {
  await apiRequest(`/companies/${companyId}/print-templates/${documentType}`, {
    method: 'PUT',
    throwOnError: true,
    body: { settings },
  });
}

/** Saved settings merged over the defaults (new fields get their default). */
export function resolvePrintTemplateSettings(
  saved: PrintTemplateSettings | undefined | null,
  fallback: PrintTemplateSettings = DEFAULT_PRINT_TEMPLATE_SETTINGS,
): PrintTemplateSettings {
  if (!saved) return fallback;
  return {
    ...fallback,
    ...saved,
    header: { ...fallback.header, ...saved.header },
    footer: { ...fallback.footer, ...saved.footer },
  };
}

/** The document's starting point when nothing is saved yet. */
export function documentStarter(documentType: PrintDocumentType): PrintTemplateSettings {
  return PRINT_DOCUMENTS.find((d) => d.id === documentType)?.starter ?? DEFAULT_PRINT_TEMPLATE_SETTINGS;
}

export function useCompanyPrintTemplates(companyId: string | null | undefined) {
  return useQuery({
    queryKey: queryKey(companyId),
    queryFn: () => fetchPrintTemplates(companyId!),
    enabled: Boolean(companyId),
    staleTime: 5 * 60_000,
  });
}

/**
 * What a document prints with: its own template, else the unified one, else
 * the document's built-in starting point.
 */
export function resolveDocumentPrintSettings(
  templates: CompanyPrintTemplates | undefined,
  documentType: PrintDocumentType,
): PrintTemplateSettings {
  const own = documentType === 'default' ? undefined : templates?.[documentType];
  if (own) return resolvePrintTemplateSettings(own);
  if (templates?.default) return resolvePrintTemplateSettings(templates.default);
  return documentStarter(documentType);
}

export function useDocumentPrintSettings(
  companyId: string | null | undefined,
  documentType: PrintDocumentType,
): PrintTemplateSettings {
  const { data } = useCompanyPrintTemplates(companyId);
  // Same object while the saved settings do not change: screens copy it into
  // a draft in an effect, and a new object each render would loop.
  return React.useMemo(() => resolveDocumentPrintSettings(data, documentType), [data, documentType]);
}

/** POS receipts (kept for the POS screens). */
export function usePrintTemplateSettings(companyId: string | null | undefined): PrintTemplateSettings {
  return useDocumentPrintSettings(companyId, 'pos_receipt');
}

export function useSavePrintTemplate(companyId: string | null | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { documentType: PrintDocumentType; settings: PrintTemplateSettings | null }) =>
      savePrintTemplate(companyId!, input.documentType, input.settings),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKey(companyId) }),
  });
}
