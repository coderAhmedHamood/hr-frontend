'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { HRRequestFieldDefinition, HRRequestTemplateEntity } from '@/features/hr/requests/lib/types';
import { cn } from '@/shared/utils';

export type HRRequestTemplateFieldsFormValues = Record<string, unknown>;

export function validateTemplateRequired(fields: HRRequestFieldDefinition[], values: HRRequestTemplateFieldsFormValues): string | null {
  for (const f of fields) {
    if (!f.required) continue;
    const v = values[f.id];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
      return `الحقل "${f.labelAr}" إلزامي`;
    }
  }
  return null;
}

interface Props {
  template: HRRequestTemplateEntity;
  values: HRRequestTemplateFieldsFormValues;
  onChange: (values: HRRequestTemplateFieldsFormValues) => void;
}

export function HRRequestTemplateFieldsForm({ template, values, onChange }: Props) {
  const sorted = [...template.formFields].sort((a, b) => a.sortOrder - b.sortOrder);
  const set = (id: string, v: unknown) => onChange({ ...values, [id]: v });

  return (
    <div className="space-y-4">
      {sorted.map(f => (
        <FieldInput key={f.id} field={f} value={values[f.id]} onChange={v => set(f.id, v)} />
      ))}
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">لا توجد حقول في هذا القالب</p>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: HRRequestFieldDefinition; value: unknown; onChange: (v: unknown) => void }) {
  const base = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  const label = (
    <Label className="text-xs font-medium text-muted-foreground">
      {field.labelAr}{field.required && <span className="text-destructive"> *</span>}
    </Label>
  );

  switch (field.kind) {
    case 'textarea':
      return (
        <div className="space-y-1.5">
          {label}
          <textarea
            rows={3}
            className={cn(base, 'resize-none')}
            placeholder={field.placeholder}
            value={(value as string) ?? ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex cursor-pointer items-center gap-2.5">
          <Checkbox checked={!!value} onCheckedChange={v => onChange(v === true)} />
          <span className="text-sm">{field.labelAr}{field.required && <span className="text-destructive"> *</span>}</span>
        </label>
      );

    case 'checkbox_group': {
      const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-1.5">
          {label}
          <div className="space-y-2">
            {(field.options ?? []).map(opt => (
              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={selected.includes(opt.id)}
                  onCheckedChange={checked => {
                    const next = checked ? [...selected, opt.id] : selected.filter(id => id !== opt.id);
                    onChange(next);
                  }}
                />
                <span className="text-sm">{opt.labelAr}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'radio_group':
      return (
        <div className="space-y-1.5">
          {label}
          <div className="space-y-2">
            {(field.options ?? []).map(opt => (
              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.id}
                  checked={value === opt.id}
                  onChange={() => onChange(opt.id)}
                  className="accent-primary"
                />
                <span className="text-sm">{opt.labelAr}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          {label}
          <input type="number" className={base} placeholder={field.placeholder} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} dir="ltr" />
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1.5">
          {label}
          <input type="date" className={base} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} dir="ltr" />
        </div>
      );

    case 'time':
      return (
        <div className="space-y-1.5">
          {label}
          <input type="time" className={base} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} dir="ltr" />
        </div>
      );

    case 'datetime':
      return (
        <div className="space-y-1.5">
          {label}
          <input type="datetime-local" className={base} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} dir="ltr" />
        </div>
      );

    case 'email':
      return (
        <div className="space-y-1.5">
          {label}
          <input type="email" className={cn(base, 'font-mono')} placeholder={field.placeholder ?? 'name@example.com'} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} dir="ltr" />
        </div>
      );

    default:
      return (
        <div className="space-y-1.5">
          {label}
          <input type="text" className={base} placeholder={field.placeholder} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} />
        </div>
      );
  }
}
