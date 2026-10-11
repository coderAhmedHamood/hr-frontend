'use client';

import { OfficialDocumentView } from '@/features/print-templates/components/official-document-view';
import { PosTicketView } from '@/features/print-templates/components/pos-ticket-view';
import type {
  PrintCompany,
  PrintableDocument,
  PrintTemplateSettings,
} from '@/features/print-templates/domain/types';

/**
 * Official documents render as the shared A4 identity. A thermal paper size
 * is the POS ticket and never borrows that identity.
 */
export function PrintDocumentView({
  document: doc,
  company,
  settings,
}: {
  document: PrintableDocument;
  company: PrintCompany;
  settings: PrintTemplateSettings;
}) {
  if (settings.paper === 'a4') {
    return <OfficialDocumentView document={doc} company={company} settings={settings} />;
  }
  return <PosTicketView document={doc} company={company} settings={settings} />;
}
