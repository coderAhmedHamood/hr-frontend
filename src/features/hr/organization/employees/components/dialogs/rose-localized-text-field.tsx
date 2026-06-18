'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LocalizedText } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

type LocalizedTextFieldProps = {
  labelAr: string;
  labelEn: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
};

export function LocalizedTextField({
  labelAr,
  labelEn,
  value,
  onChange,
  multiline = false,
  rows = 3,
}: LocalizedTextFieldProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{labelAr}</Label>
        {multiline ? (
          <Textarea
            value={value.ar}
            onChange={(e) => onChange({ ...value, ar: e.target.value })}
            rows={rows}
            dir="rtl"
            className="text-right text-sm"
          />
        ) : (
          <Input
            value={value.ar}
            onChange={(e) => onChange({ ...value, ar: e.target.value })}
            dir="rtl"
            className="text-right"
          />
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{labelEn}</Label>
        {multiline ? (
          <Textarea
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            rows={rows}
            dir="ltr"
            className="text-sm"
          />
        ) : (
          <Input
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            dir="ltr"
          />
        )}
      </div>
    </div>
  );
}
