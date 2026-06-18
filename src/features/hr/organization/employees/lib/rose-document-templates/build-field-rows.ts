import { ROSE_MERGE_FIELD_MAP } from '@/features/hr/organization/employees/lib/rose-document-templates/merge-field-catalog';
import { resolveRoseMergeValue, type RoseMergeContextInput } from '@/features/hr/organization/employees/lib/rose-document-templates/resolve-merge-context';
import type {
  DocumentLocale,
  RoseFieldGridSlot,
  RoseFieldRow,
  RoseMergeFieldKey,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export function buildVisibleFieldRows(
  fieldSlots: RoseFieldGridSlot[],
  fieldVisibility: Partial<Record<RoseMergeFieldKey, boolean>>,
  fieldOverrides: Partial<Record<RoseMergeFieldKey, string>>,
  mergeCtx: RoseMergeContextInput,
  locale: DocumentLocale,
): RoseFieldRow[] {
  return fieldSlots
    .filter((slot) => fieldVisibility[slot.fieldKey] ?? slot.visible)
    .map((slot) => {
      const meta = ROSE_MERGE_FIELD_MAP[slot.fieldKey];
      const resolved = resolveRoseMergeValue(slot.fieldKey, mergeCtx);
      const override = fieldOverrides[slot.fieldKey];
      const label = locale === 'en'
        ? (slot.labelEn ?? meta.labelEn)
        : (slot.labelAr ?? meta.labelAr);
      const value = override ?? (locale === 'en' && resolved.en ? resolved.en : resolved.ar);
      return { label, value };
    });
}

export function buildDefaultFieldVisibility(
  fieldSlots: RoseFieldGridSlot[],
): Partial<Record<RoseMergeFieldKey, boolean>> {
  return Object.fromEntries(
    fieldSlots.map((s) => [s.fieldKey, s.visible]),
  ) as Partial<Record<RoseMergeFieldKey, boolean>>;
}
