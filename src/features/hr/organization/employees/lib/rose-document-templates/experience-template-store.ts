import { createRoseTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/create-rose-template-store';
import {
  DEFAULT_ROSE_EXPERIENCE_TEMPLATE,
  normalizeExperienceTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-experience-template';
import type { RoseExperienceTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const { useStore, getNormalizedTemplate } = createRoseTemplateStore<RoseExperienceTemplateContent>({
  storageKey: 'rose-hr-experience-template-v1',
  version: 1,
  defaultTemplate: DEFAULT_ROSE_EXPERIENCE_TEMPLATE,
  normalize: normalizeExperienceTemplate,
});

export const useRoseExperienceTemplateStore = useStore;
export const getNormalizedExperienceTemplate = getNormalizedTemplate;
