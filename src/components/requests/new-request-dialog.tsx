'use client';

import * as React from 'react';
import { CalendarDays, Clock, FileText, Mail, Package, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/shared/utils';

const requestSchema = z.object({
  type: z.string().min(1, 'اختر نوع الطلب'),
  title: z.string().min(3, 'العنوان مطلوب'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

type RequestForm = z.infer<typeof requestSchema>;

const requestTypes = [
  { value: 'leave', label: 'إجازة', icon: CalendarDays, iconClass: 'bg-primary/10 text-primary' },
  { value: 'permission', label: 'استئذان', icon: Clock, iconClass: 'bg-gold/10 text-gold' },
  { value: 'advance', label: 'سلفة مالية', icon: Wallet, iconClass: 'bg-destructive/10 text-destructive' },
  { value: 'salary-letter', label: 'خطاب تعريف', icon: Mail, iconClass: 'bg-primary-500/10 text-primary-500' },
  { value: 'equipment', label: 'طلب معدات', icon: Package, iconClass: 'bg-primary-700/10 text-primary-700' },
  { value: 'attendance-correction', label: 'تصحيح حضور', icon: FileText, iconClass: 'bg-warning/10 text-warning' },
] as const;

export function NewRequestDialog({
  open,
  onOpenChange,
  initialType = '',
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** مثلاً `leave` عند فتح الحوار من بطاقة إجازة */
  initialType?: string;
}) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: initialType || '',
      title: '',
      description: '',
      fromDate: '',
      toDate: '',
    },
  });

  const fromDateVal = useWatch({ control, name: 'fromDate' });

  React.useEffect(() => {
    if (open) {
      reset({
        type: initialType || '',
        title: '',
        description: '',
        fromDate: '',
        toDate: '',
      });
    }
  }, [open, initialType, reset]);

  const onSubmit = (values: RequestForm) => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">تقديم طلب جديد</DialogTitle>
          <DialogDescription>املأ النموذج لتقديم طلبك. سيتم توجيهه إلى المدير المباشر.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>نوع الطلب</Label>
            <div className="grid grid-cols-3 gap-2">
              {requestTypes.map((t) => (
                <label
                  key={t.value}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-border p-3 transition-all hover:border-gold/40 hover:bg-muted/30 has-[:checked]:border-gold has-[:checked]:bg-gold/5"
                >
                  <input type="radio" value={t.value} {...register('type')} className="sr-only" />
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', t.iconClass)}>
                    <t.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">{t.label}</span>
                </label>
              ))}
            </div>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>عنوان الطلب</Label>
            <Input placeholder="مثال: إجازة اعتيادية لمدة 5 أيام" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Controller
                name="fromDate"
                control={control}
                render={({ field }) => (
                  <DatePickerInput
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="من…"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Controller
                name="toDate"
                control={control}
                render={({ field }) => (
                  <DatePickerInput
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="إلى…"
                    minDate={fromDateVal || undefined}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف والتفاصيل</Label>
            <Textarea placeholder="اكتب تفاصيل طلبك هنا..." rows={4} {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" variant="luxe" className="flex-1">
              تقديم الطلب
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
