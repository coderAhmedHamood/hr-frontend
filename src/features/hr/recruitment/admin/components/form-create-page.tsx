'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, GripVertical, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RecruitmentFormField, RecruitmentFormFieldType } from '@/features/hr/recruitment/lib/types';
import { uid } from '@/features/hr/recruitment/lib/utils';
import { useRecruitmentStore } from '@/features/hr/recruitment/lib/store';

const FIELD_TYPE_LABELS: Record<RecruitmentFormFieldType, string> = {
  text: 'نص',
  number: 'رقم',
  select: 'قائمة منسدلة',
  file: 'ملف',
};

const FIELD_TYPE_COLORS: Record<RecruitmentFormFieldType, string> = {
  text: 'bg-blue-50 text-blue-700 border-blue-200',
  number: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  select: 'bg-amber-50 text-amber-700 border-amber-200',
  file: 'bg-rose-50 text-rose-700 border-rose-200',
};

function SelectOptionsEditor({
  options = [],
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addOption = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) { toast.error('الخيار موجود مسبقاً'); return; }
    onChange([...options, trimmed]);
    setInputValue('');
  };

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOption(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-8">
        {options.map((opt, idx) => (
          <span
            key={`${opt}-${idx}`}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-sm shadow-sm"
          >
            {opt}
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="mr-1 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب خياراً واضغط Enter"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => addOption(inputValue)}
          disabled={!inputValue.trim()}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function FormCreatePage() {
  const router = useRouter();
  const { addForm } = useRecruitmentStore();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [fields, setFields] = React.useState<RecruitmentFormField[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null);

  const addField = (type: RecruitmentFormFieldType) => {
    setFields((prev) => [
      ...prev,
      {
        id: `field-${uid()}`,
        type,
        label: '',
        required: true,
        options: type === 'select' ? [] : undefined,
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, patch: Partial<RecruitmentFormField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const moveField = (from: number, to: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingIdx !== null && draggingIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const sourceIdx = Number(e.dataTransfer.getData('text/plain'));
    if (!isNaN(sourceIdx) && sourceIdx !== targetIdx) {
      moveField(sourceIdx, targetIdx);
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const handleSave = () => {
    if (!title.trim()) { setError('يرجى إدخال عنوان النموذج'); return; }
    if (fields.length === 0) { setError('يجب إضافة حقل واحد على الأقل'); return; }
    for (const f of fields) {
      if (!f.label.trim()) { setError('جميع الحقول يجب أن تحتوي على اسم'); return; }
      if (f.type === 'select' && (!f.options || f.options.length === 0)) {
        setError('حقول القائمة المنسدلة يجب أن تحتوي على خيار واحد على الأقل'); return;
      }
    }

    addForm({ title: title.trim(), description: description.trim(), isActive: true, fields });
    toast.success('تم إنشاء النموذج');
    router.push('/hr/recruitment/admin');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={() => router.push('/hr/recruitment/admin')}>
          <ArrowLeft className="h-4 w-4" /> العودة
        </Button>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">إنشاء نموذج توظيف جديد</h2>
        <p className="text-sm text-muted-foreground">أضف عنواناً ووصفاً ثم اسحب الحقول لإعادة ترتيبها.</p>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="fb-title">عنوان النموذج</Label>
            <Input id="fb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: مطور برمجيات" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-desc">الوصف</Label>
            <Textarea id="fb-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف الوظيفة والمتطلبات…" rows={3} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>الحقول ({fields.length})</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addField('text')}><Plus className="h-3.5 w-3.5 me-1" /> نص</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addField('number')}><Plus className="h-3.5 w-3.5 me-1" /> رقم</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addField('select')}><Plus className="h-3.5 w-3.5 me-1" /> قائمة</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addField('file')}><Plus className="h-3.5 w-3.5 me-1" /> ملف</Button>
              </div>
            </div>

            {fields.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا توجد حقول. اضغط على أحد الأزرار أعلاه لإضافة حقل.</p>
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, idx) => {
                const isDragging = draggingIdx === idx;
                const isDragOver = dragOverIdx === idx && draggingIdx !== idx;
                return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`
                      group relative rounded-xl border bg-card p-4 shadow-soft transition-all
                      ${isDragging ? 'opacity-50 scale-[0.98] rotate-1 cursor-grabbing' : 'cursor-grab hover:shadow-elevated'}
                      ${isDragOver ? 'border-primary ring-1 ring-primary/30' : 'border-border'}
                    `}
                  >
                    {/* Drag indicator line */}
                    {isDragOver && (
                      <div className="absolute -top-1 left-4 right-4 h-0.5 rounded-full bg-primary" />
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-medium ${FIELD_TYPE_COLORS[field.type]}`}>
                        {FIELD_TYPE_LABELS[field.type]}
                      </Badge>
                      <div className="me-auto">
                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeField(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">اسم الحقل</Label>
                        <Input value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="اسم الحقل الظاهر" />
                      </div>
                      <div className="flex items-center gap-3 pt-5">
                        <Checkbox id={`req-${field.id}`} checked={field.required} onCheckedChange={(v) => updateField(idx, { required: !!v })} />
                        <Label htmlFor={`req-${field.id}`} className="text-sm font-normal">حقل إلزامي</Label>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div className="mt-3 space-y-1.5">
                        <Label className="text-xs">الخيارات</Label>
                        <SelectOptionsEditor
                          options={field.options ?? []}
                          onChange={(opts) => updateField(idx, { options: opts })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/hr/recruitment/admin')}>إلغاء</Button>
        <Button variant="luxe" onClick={handleSave}>إنشاء النموذج</Button>
      </div>
    </div>
  );
}
