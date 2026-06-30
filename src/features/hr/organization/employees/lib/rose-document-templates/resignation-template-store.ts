import { createRoseTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/create-rose-template-store';
import {
  DEFAULT_ROSE_RESIGNATION_TEMPLATE,
  normalizeResignationTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-resignation-template';
import type { RoseResignationTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const { useStore, getNormalizedTemplate } = createRoseTemplateStore<RoseResignationTemplateContent>({
  storageKey: 'rose-hr-resignation-template-v2',
  version: 3,
  defaultTemplate: DEFAULT_ROSE_RESIGNATION_TEMPLATE,
  normalize: normalizeResignationTemplate,
});

export const useRoseResignationTemplateStore = useStore;

export function getNormalizedResignationTemplate(
  state: Pick<{ template: RoseResignationTemplateContent }, 'template'> = useRoseResignationTemplateStore.getState(),
): RoseResignationTemplateContent {
  return getNormalizedTemplate(state);
}
