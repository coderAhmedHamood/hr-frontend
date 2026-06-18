'use client';

import * as React from 'react';
import { FileText, Calendar, AlignLeft, Type, Hash, List, Upload, Download, Briefcase, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { RecruitmentApplicant, RecruitmentForm, RecruitmentFormFieldType } from '@/features/hr/recruitment/lib/types';
import { DisplayDate } from '@/components/ui/table-cells';

const FIELD_ICONS: Record<RecruitmentFormFieldType, React.ElementType> = {
  text: Type,
  number: Hash,
  select: List,
  file: Upload,
};

const FIELD_COLORS: Record<RecruitmentFormFieldType, string> = {
  text: 'bg-blue-50 text-blue-600 border-blue-100',
  number: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  select: 'bg-amber-50 text-amber-600 border-amber-100',
  file: 'bg-rose-50 text-rose-600 border-rose-100',
};

interface ApplicantDetailDialogProps {
  applicant: RecruitmentApplicant | null;
  form: RecruitmentForm | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getApplicantName(applicant: RecruitmentApplicant, form: RecruitmentForm): string {
  const nameField = form.fields.find((f) => f.label.includes('اسم') || f.label.includes('الاسم') || f.id.includes('name'));
  const val = nameField ? applicant.answers[nameField.id] : undefined;
  return typeof val === 'string' && val ? val : 'متقدم جديد';
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('');
}

export function ApplicantDetailDialog({ applicant, form, open, onOpenChange }: ApplicantDetailDialogProps) {
  if (!applicant || !form) return null;

  const name = getApplicantName(applicant, form);
  const initials = getInitials(name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pb-6 pt-8">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%)' }} />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-lg font-bold text-primary-foreground shadow-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold leading-tight">{name}</DialogTitle>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 text-[10px] font-normal">
                  <Briefcase className="h-3 w-3" />
                  {form.title}
                </Badge>
                <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <DisplayDate value={applicant.submittedAt} mode="datetime" className="text-[10px] font-normal" />
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-2">
          {/* Answers Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {form.fields.map((field) => {
              const value = applicant.answers[field.id];
              const Icon = FIELD_ICONS[field.type];
              const hasValue = value !== undefined && value !== '';
              return (
                <div
                  key={field.id}
                  className={`rounded-xl border p-4 transition-colors ${hasValue ? 'bg-card border-border' : 'bg-muted/20 border-border/50'}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md border text-[10px] ${FIELD_COLORS[field.type]}`}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                    {field.required && (
                      <span className="me-auto rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                        إلزامي
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-semibold leading-relaxed ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {hasValue ? String(value) : '—'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CV Section */}
          {applicant.cvFileName && (
            <>
              <Separator className="my-5" />
              <div className="rounded-xl border border-border bg-gradient-to-r from-muted/30 to-background p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">السيرة الذاتية</p>
                    <p className="truncate text-xs text-muted-foreground">{applicant.cvFileName}</p>
                  </div>
                  {applicant.cvFileData && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 rounded-lg"
                      asChild
                    >
                      <a href={applicant.cvFileData} download={applicant.cvFileName}>
                        <Download className="h-3.5 w-3.5" />
                        تحميل
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
