'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Send, MapPin, Briefcase, Star, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { publicRecruitmentApi } from '@/features/hr/recruitment/lib/api/recruitment';
import { usePublicRecruitmentJob } from '@/features/hr/recruitment/hooks/usePublicRecruitment';
import type { AtsFormField, AtsFormFieldType } from '@/features/hr/recruitment/lib/ats/types';
import { splitApplicantFormFields } from '@/features/hr/recruitment/lib/ats/public-application-fields';
import { buildSubmitApplicationPayload } from '@/features/hr/recruitment/lib/ats/submit-application-payload';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ApiError } from '@/features/hr/lib/api/client';

const FIELD_TYPE_ICONS: Record<AtsFormFieldType, React.ReactNode> = {
  text: <Briefcase className="h-3.5 w-3.5" />,
  number: <Star className="h-3.5 w-3.5" />,
  select: <MapPin className="h-3.5 w-3.5" />,
  file: <Upload className="h-3.5 w-3.5" />,
};

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'دوام كامل',
  'part-time': 'دوام جزئي',
  contract: 'عقد',
  internship: 'تدريب',
};

interface PublicApplicationClientProps {
  jobSlug: string;
}

function ApplicationField({
  field,
  answers,
  fileNames,
  onAnswer,
  onFileChange,
}: {
  field: AtsFormField;
  answers: Record<string, string>;
  fileNames: Record<string, string>;
  onAnswer: (fieldId: string, value: string) => void;
  onFileChange: (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputName = `apply-${field.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{FIELD_TYPE_ICONS[field.type]}</span>
        <Label htmlFor={field.id}>{field.label}</Label>
        {field.required && <span className="text-destructive">*</span>}
      </div>
      {field.type === 'text' && (
        <Input
          id={field.id}
          name={inputName}
          autoComplete="off"
          value={answers[field.id] || ''}
          onChange={(e) => onAnswer(field.id, e.target.value)}
        />
      )}
      {field.type === 'number' && (
        <Input
          id={field.id}
          name={inputName}
          type="number"
          autoComplete="off"
          value={answers[field.id] || ''}
          onChange={(e) => onAnswer(field.id, e.target.value)}
        />
      )}
      {field.type === 'select' && field.options && (
        <Select value={answers[field.id] || ''} onValueChange={(v) => onAnswer(field.id, v)}>
          <SelectTrigger id={field.id} name={inputName}>
            <SelectValue placeholder="اختر…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field.type === 'file' && (
        <div className="space-y-2">
          <Input
            id={field.id}
            name={inputName}
            type="file"
            accept=".pdf,.doc,.docx"
            autoComplete="off"
            onChange={(e) => onFileChange(field.id, e)}
          />
          {fileNames[field.id] && (
            <p className="text-xs text-muted-foreground">تم اختيار: {fileNames[field.id]}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AtsPublicApplicationClient({ jobSlug }: PublicApplicationClientProps) {
  const router = useRouter();
  const { data, isLoading, isError } = usePublicRecruitmentJob(jobSlug);
  const job = data?.job;
  const form = data?.form;

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [fileData, setFileData] = React.useState<Record<string, string>>({});
  const [fileNames, setFileNames] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setAnswers({});
    setFileData({});
    setFileNames({});
    setSubmitting(false);
  }, [jobSlug]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        جاري التحميل…
      </div>
    );
  }

  if (isError || !job || !form) {
    return (
      <div className="py-16 text-center space-y-3">
        <h1 className="text-2xl font-bold">الوظيفة غير موجودة</h1>
        <p className="text-muted-foreground">قد تمت إزالة هذه الوظيفة أو إيقافها.</p>
        <Button variant="outline" size="sm" asChild>
          <a href="/careers">العودة إلى الوظائف المتاحة</a>
        </Button>
      </div>
    );
  }

  const { identityFields, supplementalFields } = splitApplicantFormFields(form.fields);
  const showIdentitySection = identityFields.length > 0;
  const jobFields = showIdentitySection ? supplementalFields : form.fields;

  const updateAnswer = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData((prev) => ({ ...prev, [fieldId]: reader.result as string }));
      setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    for (const field of form.fields) {
      if (field.required) {
        const val = field.type === 'file' ? fileNames[field.id] : answers[field.id];
        if (!val || String(val).trim() === '') {
          toast.error(`الحقل "${field.label}" مطلوب`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const fileField = form.fields.find((f) => f.type === 'file');
      const cvBase64 = fileField ? fileData[fileField.id] : undefined;
      const payload = buildSubmitApplicationPayload(form.fields, answers, {
        cvFileName: fileField ? fileNames[fileField.id] ?? null : null,
        cvFileBase64: cvBase64 ?? null,
      });
      await publicRecruitmentApi.submitApplication(jobSlug, payload);
      setAnswers({});
      setFileData({});
      setFileNames({});
      toast.success('تم تقديم طلبك بنجاح!');
      setTimeout(() => router.push('/careers'), 2000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('تم التقديم مسبقاً على هذه الوظيفة');
        return;
      }
      const { displayMessage } = handleApiError(err, 'recruitment.public.apply');
      toast.error(displayMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div key={`apply-${jobSlug}`} className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
          <a href="/careers">← جميع الوظائف</a>
        </Button>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="relative bg-linear-to-br from-primary/10 via-primary/5 to-background px-6 pb-6 pt-8">
          <div className="absolute inset-0 opacity-10 surface-radial-primary-start" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-[10px]">{JOB_TYPE_LABELS[job.type]}</Badge>
              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {job.location}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{job.department}</p>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
        </CardContent>
      </Card>

      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-6"
      >
        {showIdentitySection && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCircle className="h-5 w-5 text-primary" />
                بيانات المتقدم
              </CardTitle>
              <CardDescription className="text-xs">
                حقلان أساسيان في كل تقديم: الاسم ورقم الإقامة — يُرسلان مباشرة مع الطلب.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {identityFields.map((field) => (
                <ApplicationField
                  key={field.id}
                  field={field}
                  answers={answers}
                  fileNames={fileNames}
                  onAnswer={updateAnswer}
                  onFileChange={handleFileChange}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {showIdentitySection ? 'أسئلة الوظيفة' : 'نموذج التقديم'}
            </CardTitle>
            {showIdentitySection && jobFields.length > 0 && (
              <CardDescription className="text-xs">
                معلومات إضافية مطلوبة لهذه الوظيفة
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {jobFields.length === 0 && showIdentitySection ? (
              <p className="text-sm text-muted-foreground">لا توجد حقول إضافية لهذه الوظيفة.</p>
            ) : (
              jobFields.map((field) => (
                <ApplicationField
                  key={field.id}
                  field={field}
                  answers={answers}
                  fileNames={fileNames}
                  onAnswer={updateAnswer}
                  onFileChange={handleFileChange}
                />
              ))
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <a href="/careers">إلغاء</a>
              </Button>
              <Button type="submit" variant="luxe" disabled={submitting}>
                <Send className="h-4 w-4 me-1" />
                {submitting ? 'جارٍ الإرسال…' : 'تقديم الطلب'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
