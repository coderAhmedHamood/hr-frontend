'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/features/hr/lib/api/client';
import {
  DEFAULT_PRINT_TEMPLATE_SETTINGS,
  POS_RECEIPT_PRINT_TEMPLATE_SETTINGS,
  PRINT_DOCUMENTS,
  layoutFromTemplate,
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
  // The legacy browser setting was a POS receipt template. Keep it thermal
  // instead of turning the company's official identity into a receipt.
  if (!out.pos_receipt) {
    const legacy = readLegacy(companyId);
    if (legacy) {
      try {
        await savePrintTemplate(
          companyId,
          'pos_receipt',
          resolvePrintTemplateSettings(legacy, POS_RECEIPT_PRINT_TEMPLATE_SETTINGS),
        );
        out.pos_receipt = resolvePrintTemplateSettings(legacy, POS_RECEIPT_PRINT_TEMPLATE_SETTINGS);
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
    layout: saved.layout ?? layoutFromTemplate(saved.templateId),
    tableStyle: saved.tableStyle ?? fallback.tableStyle,
    slogan: saved.slogan ?? fallback.slogan,
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
 * Official documents always use the company's unified A4 identity. POS is
 * the sole thermal family and intentionally never inherits that identity.
 */
export function resolveDocumentPrintSettings(
  templates: CompanyPrintTemplates | undefined,
  documentType: PrintDocumentType,
): PrintTemplateSettings {
  if (documentType === 'pos_receipt') {
    const receipt = resolvePrintTemplateSettings(templates?.pos_receipt, POS_RECEIPT_PRINT_TEMPLATE_SETTINGS);
    return { ...receipt, paper: receipt.paper === '58mm' ? '58mm' : '80mm' };
  }
  const official = resolvePrintTemplateSettings(templates?.default, DEFAULT_PRINT_TEMPLATE_SETTINGS);
  return { ...official, paper: 'a4' };
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
