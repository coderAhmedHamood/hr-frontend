'use client';

import * as React from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { MinimalDropdown } from '@/components/ui/shared-dialogs';
import type { HRRequestFieldDefinition, HRRequestFieldKind, HRRequestFieldOption } from '@/features/hr/requests/lib/types';
import { cn } from '@/shared/utils';

const KIND_LABELS: Record<HRRequestFieldKind, string> = {
  text: 'نص قصير', textarea: 'نص طويل', number: 'رقم', date: 'تاريخ',
  time: 'وقت', datetime: 'تاريخ ووقت', checkbox: 'خانة اختيار',
  checkbox_group: 'مجموعة خانات', radio_group: 'اختيار واحد', email: 'بريد إلكتروني',
};

const KIND_OPTIONS = (Object.keys(KIND_LABELS) as HRRequestFieldKind[]).map(k => ({ value: k, label: KIND_LABELS[k] }));
const HAS_OPTIONS: HRRequestFieldKind[] = ['checkbox_group', 'radio_group'];

function uid() { return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }
function oid() { return `o-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

interface FieldRowProps {
  field: HRRequestFieldDefinition;
  index: number;
  total: number;
  onChange: (f: HRRequestFieldDefinition) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

function FieldRow({ field, index, total, onChange, onRemove, onMove }: FieldRowProps) {
  const patch = <K extends keyof HRRequestFieldDefinition>(k: K, v: HRRequestFieldDefinition[K]) =>
    onChange({ ...field, [k]: v });

  const addOption = () => {
    const opts: HRRequestFieldOption[] = [...(field.options ?? []), { id: oid(), labelAr: '' }];
    patch('options', opts);
  };

  const removeOption = (id: string) => patch('options', (field.options ?? []).filter(o => o.id !== id));

  const updateOption = (id: string, labelAr: string) =>
    patch('options', (field.options ?? []).map(o => o.id === id ? { ...o, labelAr } : o));

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button type="button" disabled={index === 0} onClick={() => onMove('up')} className="disabled:opacity-30 hover:text-primary"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove('down')} className="disabled:opacity-30 hover:text-primary"><ChevronDown className="h-3.5 w-3.5" /></button>
        </div>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">التسمية بالعربية *</Label>
            <Input value={field.labelAr} onChange={e => patch('labelAr', e.target.value)} placeholder="اسم الحقل" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">نوع الحقل</Label>
            <MinimalDropdown value={field.kind} onChange={v => patch('kind', v as HRRequestFieldKind)} options={KIND_OPTIONS} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">النص الإرشادي (placeholder)</Label>
            <Input value={field.placeholder ?? ''} onChange={e => patch('placeholder', e.target.value)} placeholder="اختياري" />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox checked={!!field.required} onCheckedChange={v => patch('required', v === true)} />
            إلزامي
          </label>
          <Button variant="ghost" size="icon" type="button" className="text-destructive hover:text-destructive h-7 w-7" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {HAS_OPTIONS.includes(field.kind) && (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs font-medium text-muted-foreground">الخيارات</p>
          {(field.options ?? []).map(opt => (
            <div key={opt.id} className="flex items-center gap-2">
              <Input
                value={opt.labelAr}
                onChange={e => updateOption(opt.id, e.target.value)}
                placeholder="نص الخيار"
                className="h-8 text-sm"
              />
              <Button variant="ghost" size="icon" type="button" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeOption(opt.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" type="button" className="gap-1" onClick={addOption}>
            <Plus className="h-3.5 w-3.5" /> إضافة خيار
          </Button>
        </div>
      )}
    </div>
  );
}

interface Props {
  fields: HRRequestFieldDefinition[];
  onChange: (fields: HRRequestFieldDefinition[]) => void;
}

export function HRRequestTypeTemplateFieldsEditor({ fields, onChange }: Props) {
  const addField = () => {
    onChange([...fields, { id: uid(), labelAr: '', kind: 'text', required: false, sortOrder: fields.length + 1 }]);
  };

  const updateField = (idx: number, f: HRRequestFieldDefinition) => {
    const next = [...fields];
    next[idx] = f;
    onChange(next);
  };

  const removeField = (idx: number) => onChange(fields.filter((_, i) => i !== idx));

  const moveField = (idx: number, dir: 'up' | 'down') => {
    const next = [...fields];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx]!, next[idx]!];
    onChange(next.map((f, i) => ({ ...f, sortOrder: i + 1 })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">حقول النموذج <span className="text-muted-foreground font-normal">({fields.length})</span></p>
        <Button variant="outline" size="sm" type="button" className="gap-1.5" onClick={addField}>
          <Plus className="h-4 w-4" /> إضافة حقل
        </Button>
      </div>
      {fields.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          لا توجد حقول. أضف حقلاً للبدء.
        </div>
      )}
      <div className="space-y-2">
        {fields.map((f, i) => (
          <FieldRow
            key={f.id}
            field={f}
            index={i}
            total={fields.length}
            onChange={upd => updateField(i, upd)}
            onRemove={() => removeField(i)}
            onMove={dir => moveField(i, dir)}
          />
        ))}
      </div>
    </div>
  );
}
