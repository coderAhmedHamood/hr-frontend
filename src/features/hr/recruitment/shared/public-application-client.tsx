'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { useRecruitmentStore } from '@/features/hr/recruitment/lib/store';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import type { RecruitmentFormField } from '@/features/hr/recruitment/lib/types';

export function PublicApplicationClient() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const { forms, addApplicant } = useRecruitmentStore();
  const { data: activeCompany } = useActiveCompany();
  const form = React.useMemo(() => forms.find((f) => f.id === formId), [forms, formId]);

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [files, setFiles] = React.useState<Record<string, { name: string; data: string }>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">النموذج غير موجود أو لم يعد متاحاً.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">هذا النموذج معطل حالياً.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = async (fieldId: string, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFiles((prev) => ({ ...prev, [fieldId]: { name: file.name, data: result } }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const missing = form.fields.filter((f) => f.required && f.type !== 'file' && !answers[f.id]?.trim());
    const missingFile = form.fields.filter((f) => f.required && f.type === 'file' && !files[f.id]);
    if (missing.length > 0 || missingFile.length > 0) {
      toast.error('يرجى تعبئة جميع الحقول الإلزامية');
      return;
    }

    setLoading(true);
    const numericAnswers: Record<string, string | number | boolean | undefined> = { ...answers };
    for (const f of form.fields) {
      if (f.type === 'number' && answers[f.id]) {
        numericAnswers[f.id] = Number(answers[f.id]);
      }
    }

    const fileField = form.fields.find((f) => f.type === 'file');

    setTimeout(() => {
      addApplicant({
        formId: form.id,
        answers: numericAnswers,
        cvFileName: fileField ? files[fileField.id]?.name : undefined,
        cvFileData: fileField ? files[fileField.id]?.data : undefined,
      });
      setLoading(false);
      setSubmitted(true);
      toast.success('تم إرسال طلبك بنجاح');
    }, 400);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>تم الإرسال بنجاح</CardTitle>
            <CardDescription>شكراً لتقديمك. سنتواصل معك قريباً.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{form.title}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/50 px-4 py-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-3">
            {activeCompany?.logoUrl && (
              <Image src={activeCompany.logoUrl} alt={activeCompany.nameAr} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
            )}
            <div>
              <h1 className="text-lg font-bold">{activeCompany?.nameAr ?? ''}</h1>
              <p className="text-xs text-muted-foreground">{activeCompany?.nameEn ?? ''}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{form.title}</h2>
            <p className="text-sm text-muted-foreground">{form.description}</p>
          </div>

          <div className="space-y-4">
            {form.fields.map((field) => (
              <FormFieldRenderer
                key={field.id}
                field={field}
                value={answers[field.id] ?? ''}
                onChange={(v) => handleChange(field.id, v)}
                onFileChange={(list) => handleFileChange(field.id, list)}
                fileName={files[field.id]?.name}
              />
            ))}
          </div>

          <Button variant="luxe" className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'جارٍ الإرسال…' : 'تقديم الطلب'}
          </Button>
        </div>
      </main>
    </div>
  );
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  onFileChange,
  fileName,
}: {
  field: RecruitmentFormField;
  value: string;
  onChange: (v: string) => void;
  onFileChange: (files: FileList | null) => void;
  fileName?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ms-1">*</span>}
      </Label>

      {field.type === 'text' && (
        <Input id={field.id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />
      )}

      {field.type === 'number' && (
        <Input id={field.id} type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />
      )}

      {field.type === 'select' && (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.id}>
            <SelectValue placeholder={`اختر ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === 'file' && (
        <div className="space-y-2">
          <Input id={field.id} type="file" accept=".pdf" onChange={(e) => onFileChange(e.target.files)} />
          {fileName && <p className="text-xs text-muted-foreground">الملف المحدد: {fileName}</p>}
        </div>
      )}
    </div>
  );
}
