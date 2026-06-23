'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, ArrowRight, GripVertical, X,
  FileText, Hash, List, Paperclip, Briefcase, MapPin, Building2, Clock,
  LayoutTemplate, Sparkles, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';
import type { AtsFormField, AtsFormFieldType, AtsJobType } from '@/features/hr/recruitment/lib/ats/types';
import { uid } from '@/features/hr/recruitment/lib/ats/utils';
import { RecruitmentJobNav } from '@/features/hr/recruitment/ats/components/recruitment-job-nav';
import { useRecruitmentJobDetail, useRecruitmentMutations } from '@/features/hr/recruitment/hooks/useRecruitment';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

// ─── Field type palette ───────────────────────────────────────────────────────

const FIELD_TYPES: {
  type: AtsFormFieldType;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { type: 'text',   label: 'نص',    icon: FileText,  color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  { type: 'number', label: 'رقم',   icon: Hash,      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { type: 'select', label: 'قائمة', icon: List,      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { type: 'file',   label: 'ملف',   icon: Paperclip, color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
];

// ─── Common preset fields ─────────────────────────────────────────────────────

const COMMON_FIELDS: { label: string; type: AtsFormFieldType; options?: string[] }[] = [
  { label: 'الاسم الكامل',       type: 'text' },
  { label: 'البريد الإلكتروني',  type: 'text' },
  { label: 'رقم الجوال',         type: 'text' },
  { label: 'رقم الهوية',         type: 'text' },
  { label: 'الجنسية',            type: 'select', options: ['سعودي', 'غير سعودي'] },
  { label: 'المؤهل العلمي',      type: 'select', options: ['ثانوي', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه'] },
  { label: 'سنوات الخبرة',       type: 'number' },
  { label: 'السيرة الذاتية',     type: 'file' },
  { label: 'خطاب التقديم',       type: 'file' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SelectOptionsEditor({ options = [], onChange }: { options: string[]; onChange: (o: string[]) => void }) {
  const [val, setVal] = React.useState('');
  const add = (v: string) => {
    const t = v.trim();
    if (!t) return;
    if (options.includes(t)) { toast.error('الخيار موجود مسبقاً'); return; }
    onChange([...options, t]);
    setVal('');
  };
  return (
    <div className="space-y-2">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs">
              {opt}
              <button type="button" onClick={() => onChange(options.filter((_, j) => j !== i))}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive hover:text-white transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(val); } }}
          placeholder="اكتب خياراً واضغط Enter" className="h-8 text-xs" />
        <Button type="button" variant="outline" size="sm" className="h-8 px-2 shrink-0"
          onClick={() => add(val)} disabled={!val.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Canvas field card ────────────────────────────────────────────────────────

function FieldCard({
  field, idx, cfg, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd, onRemove, onUpdate,
}: {
  field: AtsFormField; idx: number; cfg: typeof FIELD_TYPES[number];
  isDragging: boolean; isDragOver: boolean;
  onDragStart: (e: React.DragEvent, i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (e: React.DragEvent, i: number) => void;
  onDragEnd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, patch: Partial<AtsFormField>) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
      onDragEnd={onDragEnd}
      className={cn(
        'relative rounded-xl border bg-card shadow-soft transition-all select-none',
        isDragging ? 'opacity-40 scale-[0.98]' : 'hover:shadow-elevated',
        isDragOver ? 'border-primary ring-2 ring-primary/20' : 'border-border',
      )}
    >
      {isDragOver && <div className="absolute -top-px left-4 right-4 h-0.5 rounded-full bg-primary" />}

      {/* Header row */}
      <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-2.5">
        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/30 shrink-0" />
        <div className={cn('flex h-5 w-5 items-center justify-center rounded text-[10px] border', cfg.color)}>
          <cfg.icon className="h-3 w-3" />
        </div>
        <Badge variant="outline" className={cn('text-[10px] px-2 py-0 h-4', cfg.color)}>{cfg.label}</Badge>
        <span className="flex-1 truncate text-xs text-muted-foreground">{field.label || 'بدون اسم'}</span>
        {field.required && (
          <span className="rounded-full bg-destructive/10 px-1.5 py-px text-[10px] text-destructive shrink-0">إلزامي</span>
        )}
        <button type="button" onClick={() => onRemove(idx)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">اسم الحقل</Label>
          <Input value={field.label} onChange={(e) => onUpdate(idx, { label: e.target.value })}
            placeholder="الاسم الظاهر للمتقدم" className="h-8 text-xs" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Checkbox id={`req-${field.id}`} checked={field.required}
            onCheckedChange={(v) => onUpdate(idx, { required: !!v })} />
          <Label htmlFor={`req-${field.id}`} className="text-xs font-normal cursor-pointer">حقل إلزامي</Label>
        </div>
        {field.type === 'select' && (
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-[11px] text-muted-foreground">الخيارات</Label>
            <SelectOptionsEditor options={field.options ?? []} onChange={(o) => onUpdate(idx, { options: o })} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Live preview panel ───────────────────────────────────────────────────────

function LivePreview({ fields }: { fields: AtsFormField[] }) {
  if (fields.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">معاينة النموذج</span>
        <span className="ms-auto text-[10px] text-muted-foreground/50 tabular-nums">{fields.length} حقل</span>
      </div>
      <div className="space-y-2.5 p-4">
        {fields.map((f) => {
          const cfg = FIELD_TYPES.find((t) => t.type === f.type)!;
          return (
            <div key={f.id} className="space-y-0.5">
              <p className="text-[11px] font-medium">
                {f.label || 'حقل'}
                {f.required && <span className="text-destructive ms-0.5">*</span>}
              </p>
              {(f.type === 'text' || f.type === 'number') && (
                <div className="h-7 rounded-lg border border-border bg-muted/30 px-2.5 flex items-center">
                  <span className="text-[10px] text-muted-foreground/40">{f.type === 'number' ? '0' : 'نص…'}</span>
                </div>
              )}
              {f.type === 'select' && (
                <div className="h-7 rounded-lg border border-border bg-muted/30 px-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/40">{f.options?.[0] ?? 'اختر…'}</span>
                  <cfg.icon className="h-3 w-3 text-muted-foreground/30" />
                </div>
              )}
              {f.type === 'file' && (
                <div className="h-7 rounded-lg border border-dashed border-border bg-muted/20 px-2.5 flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground/40">اختر ملفاً</span>
                </div>
              )}
            </div>
          );
        })}
        <div className="pt-1">
          <div className="h-8 w-full rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-primary/60">إرسال الطلب</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function JobCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { createJob, updateJob } = useRecruitmentMutations();
  const { data: editData, isLoading: editLoading } = useRecruitmentJobDetail(editId ?? undefined);
  const existingJob = editData?.job;
  const existingForm = editData?.form;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [jobType, setJobType] = React.useState<AtsJobType>('full-time');
  const [fields, setFields] = React.useState<AtsFormField[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null);
  const [canvasOver, setCanvasOver] = React.useState(false);
  const [jobOpen, setJobOpen] = React.useState(true);

  React.useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title); setDescription(existingJob.description);
      setDepartment(existingJob.department); setLocation(existingJob.location);
      setJobType(existingJob.type);
    }
    if (existingForm) setFields(existingForm.fields.map((f) => ({ ...f })));
    else setFields([]);
    setError(null);
  }, [existingJob, existingForm]);

  const makeField = (type: AtsFormFieldType, label = ''): AtsFormField => ({
    id: `field-${uid()}`, type, label, required: true,
    options: type === 'select' ? [] : undefined,
  });

  const addField = (type: AtsFormFieldType) => setFields((p) => [...p, makeField(type)]);

  const addPreset = (preset: typeof COMMON_FIELDS[number]) => {
    // don't add duplicate labels
    if (fields.some((f) => f.label === preset.label)) {
      toast.error(`"${preset.label}" موجود بالفعل في النموذج`);
      return;
    }
    setFields((p) => [...p, { ...makeField(preset.type, preset.label), options: preset.options ? [...preset.options] : undefined }]);
  };

  const removeField = (i: number) => setFields((p) => p.filter((_, j) => j !== i));
  const updateField = (i: number, patch: Partial<AtsFormField>) =>
    setFields((p) => p.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  // drag-reorder existing fields
  const handleDragStart = (e: React.DragEvent, i: number) => {
    setDraggingIdx(i);
    e.dataTransfer.setData('field-idx', String(i));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (draggingIdx !== null && draggingIdx !== i) setDragOverIdx(i);
  };
  const handleDrop = (e: React.DragEvent, to: number) => {
    e.preventDefault();
    const palType = e.dataTransfer.getData('palette-type') as AtsFormFieldType | '';
    if (palType) {
      setFields((p) => { const n = [...p, makeField(palType)]; const [m] = n.splice(n.length - 1, 1); n.splice(to, 0, m); return n; });
    } else {
      const from = Number(e.dataTransfer.getData('field-idx'));
      if (!isNaN(from) && from !== to)
        setFields((p) => { const n = [...p]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });
    }
    setDraggingIdx(null); setDragOverIdx(null); setCanvasOver(false);
  };
  const handleDragEnd = () => { setDraggingIdx(null); setDragOverIdx(null); setCanvasOver(false); };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const palType = e.dataTransfer.getData('palette-type') as AtsFormFieldType | '';
    if (palType) addField(palType);
    setCanvasOver(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('يرجى إدخال عنوان الوظيفة'); return; }
    if (!department.trim()) { setError('يرجى إدخال القسم'); return; }
    if (fields.length === 0) { setError('يجب إضافة حقل واحد على الأقل'); return; }
    for (const f of fields) {
      if (!f.label.trim()) { setError('جميع الحقول يجب أن تحتوي على اسم'); return; }
      if (f.type === 'select' && (!f.options || f.options.length === 0)) {
        setError('حقول القائمة تحتاج خياراً واحداً على الأقل'); return;
      }
    }

    const formPayload = {
      title: `نموذج التقديم - ${title.trim()}`,
      description: description.trim(),
      fields: fields.map((f, index) => ({
        id: existingForm ? f.id : undefined,
        type: f.type,
        label: f.label.trim(),
        required: f.required,
        options: f.type === 'select' ? f.options : undefined,
        sortOrder: index,
      })),
    };

    try {
      if (existingJob && existingForm) {
        await updateJob.mutateAsync({
          id: existingJob.id,
          dto: {
            title: title.trim(),
            description: description.trim(),
            department: department.trim(),
            location: location.trim(),
            type: jobType,
            form: formPayload,
          },
        });
        toast.success('تم تحديث الوظيفة');
        router.push(`/hr/recruitment/ats-admin/jobs/${existingJob.id}`);
      } else {
        const created = await createJob.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          department: department.trim(),
          location: location.trim(),
          type: jobType,
          isActive: true,
          form: formPayload,
        });
        toast.success('تم إنشاء الوظيفة');
        router.push(`/hr/recruitment/ats-admin/jobs/${created.id}`);
      }
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'recruitment.jobs.save');
      setError(displayMessage);
      toast.error(displayMessage);
    }
  };

  if (editId && editLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">جاري التحميل…</div>;
  }

  const addedLabels = new Set(fields.map((f) => f.label));

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">

      {/* ── Top bar ── */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => router.push(existingJob ? `/hr/recruitment/ats-admin/jobs/${existingJob.id}` : '/hr/recruitment/ats-admin')}>
            <ArrowRight className="h-4 w-4" /> العودة
          </Button>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-base font-semibold leading-none">{existingJob ? 'تعديل وظيفة' : 'وظيفة جديدة'}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">ابنِ نموذج التقديم بالسحب والإفلات</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9"
            onClick={() => router.push('/hr/recruitment/ats-admin')}>إلغاء</Button>
          <Button variant="luxe" size="sm" className="h-9 gap-2" onClick={handleSave}>
            {existingJob ? 'حفظ التعديلات' : 'إنشاء الوظيفة'}
          </Button>
        </div>
      </div>

      {existingJob && (
        <div className="mb-5">
          <RecruitmentJobNav jobId={existingJob.id} active="form" />
        </div>
      )}

      {/* ── Job details collapsible strip ── */}
      <div className="mb-5 rounded-xl border border-border bg-card shadow-soft overflow-hidden">
        <button
          type="button"
          onClick={() => setJobOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-semibold hover:bg-muted/20 transition-colors"
        >
          <Briefcase className="h-4 w-4 text-primary shrink-0" />
          تفاصيل الوظيفة
          {!jobOpen && title && (
            <span className="ms-2 text-xs font-normal text-muted-foreground truncate">{title}{department ? ` · ${department}` : ''}</span>
          )}
          <span className={cn('ms-auto text-muted-foreground transition-transform text-xs', jobOpen ? 'rotate-180' : '')}>▲</span>
        </button>
        {jobOpen && (
          <div className="grid gap-4 border-t border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                عنوان الوظيفة <span className="text-destructive">*</span>
              </Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مطور تطبيقات" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> القسم <span className="text-destructive">*</span>
              </Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="تقنية المعلومات" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> الموقع
              </Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="الرياض" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> نوع الدوام
              </Label>
              <Select value={jobType} onValueChange={(v) => setJobType(v as AtsJobType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">دوام كامل</SelectItem>
                  <SelectItem value="part-time">دوام جزئي</SelectItem>
                  <SelectItem value="contract">عقد</SelectItem>
                  <SelectItem value="internship">تدريب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
              <Label className="text-[11px] text-muted-foreground">وصف الوظيفة</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="المهام والمتطلبات والمؤهلات…" rows={2} className="text-xs resize-none" />
            </div>
          </div>
        )}
      </div>

      {/* ── 3-col builder ── */}
      <div className="grid gap-5 lg:grid-cols-[220px_1fr_240px]">

        {/* LEFT: palette + presets */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">

          {/* Field types */}
          <div className="rounded-xl border border-border bg-card shadow-soft p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-2">
              <LayoutTemplate className="h-3.5 w-3.5 text-primary" /> أنواع الحقول
            </p>
            <p className="text-[10px] text-muted-foreground">اسحب أو انقر لإضافة حقل مخصص</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FIELD_TYPES.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  type="button"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('palette-type', type); e.dataTransfer.effectAllowed = 'copy'; }}
                  onClick={() => addField(type)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[11px] font-medium transition-all',
                    'cursor-grab hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing',
                    color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Common presets */}
          <div className="rounded-xl border border-border bg-card shadow-soft p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> حقول شائعة
            </p>
            <p className="text-[10px] text-muted-foreground">انقر لإضافة حقل جاهز قابل للتعديل</p>
            <div className="space-y-1">
              {COMMON_FIELDS.map((preset) => {
                const already = addedLabels.has(preset.label);
                const cfg = FIELD_TYPES.find((t) => t.type === preset.type)!;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={already}
                    onClick={() => addPreset(preset)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-all text-right',
                      already
                        ? 'border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed'
                        : 'border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5 hover:text-primary cursor-pointer',
                    )}
                  >
                    <cfg.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{preset.label}</span>
                    {already
                      ? <span className="text-[9px] opacity-50">مضاف</span>
                      : <Plus className="h-3 w-3 opacity-40 shrink-0" />
                    }
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER: canvas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">حقول النموذج</span>
              {fields.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary tabular-nums">
                  {fields.length}
                </span>
              )}
            </div>
            {fields.length > 1 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <GripVertical className="h-3 w-3" /> اسحب لإعادة الترتيب
              </span>
            )}
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setCanvasOver(true); }}
            onDragLeave={() => setCanvasOver(false)}
            onDrop={fields.length === 0 ? handleCanvasDrop : undefined}
            className={cn(
              'rounded-2xl transition-all duration-200',
              fields.length === 0
                ? cn('min-h-[400px] border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center p-8',
                  canvasOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/60 bg-muted/10')
                : 'space-y-2.5',
            )}
          >
            {fields.length === 0 ? (
              <>
                <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
                  canvasOver ? 'bg-primary/20' : 'bg-muted')}>
                  <LayoutTemplate className={cn('h-6 w-6 transition-colors', canvasOver ? 'text-primary' : 'text-muted-foreground/30')} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {canvasOver ? 'أفلت هنا لإضافة الحقل' : 'لا توجد حقول بعد'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/50">
                    اسحب نوعاً من اليسار أو انقر على حقل شائع
                  </p>
                </div>
              </>
            ) : (
              fields.map((field, idx) => {
                const cfg = FIELD_TYPES.find((t) => t.type === field.type)!;
                return (
                  <FieldCard
                    key={field.id} field={field} idx={idx} cfg={cfg}
                    isDragging={draggingIdx === idx}
                    isDragOver={dragOverIdx === idx && draggingIdx !== idx}
                    onDragStart={handleDragStart} onDragOver={handleDragOver}
                    onDrop={handleDrop} onDragEnd={handleDragEnd}
                    onRemove={removeField} onUpdate={updateField}
                  />
                );
              })
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* RIGHT: live preview only */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <LivePreview fields={fields} />
          {fields.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 px-4 py-8 text-center">
              <Eye className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground/50">ستظهر المعاينة هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
