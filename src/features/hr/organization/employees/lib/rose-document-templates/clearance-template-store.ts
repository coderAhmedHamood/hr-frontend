import { createRoseTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/create-rose-template-store';
import {
  DEFAULT_ROSE_CLEARANCE_TEMPLATE,
  normalizeClearanceTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-clearance-template';
import type { RoseClearanceTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const { useStore, getNormalizedTemplate } = createRoseTemplateStore<RoseClearanceTemplateContent>({
  storageKey: 'rose-hr-clearance-template-v1',
  version: 1,
  defaultTemplate: DEFAULT_ROSE_CLEARANCE_TEMPLATE,
  normalize: normalizeClearanceTemplate,
});

export const useRoseClearanceTemplateStore = useStore;
export const getNormalizedClearanceTemplate = getNormalizedTemplate;
