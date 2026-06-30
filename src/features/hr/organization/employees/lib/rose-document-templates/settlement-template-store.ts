import { createRoseTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/create-rose-template-store';
import {
  DEFAULT_ROSE_SETTLEMENT_TEMPLATE,
  normalizeSettlementTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-settlement-template';
import type { RoseSettlementTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const { useStore, getNormalizedTemplate } = createRoseTemplateStore<RoseSettlementTemplateContent>({
  storageKey: 'rose-hr-settlement-template-v1',
  version: 1,
  defaultTemplate: DEFAULT_ROSE_SETTLEMENT_TEMPLATE,
  normalize: normalizeSettlementTemplate,
});

export const useRoseSettlementTemplateStore = useStore;
export const getNormalizedSettlementTemplate = getNormalizedTemplate;
