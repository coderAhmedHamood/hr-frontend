'use client';

import { Plus, Pencil, Trash2, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import {
  usePublicHolidaysPanelModel,
  type PublicHolidayDraft,
} from '@/features/hr/leaves/public-holidays/hooks/usePublicHolidaysPanelModel';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { cn } from '@/shared/utils';

const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export function PublicHolidaysPanel() {
  const m = usePublicHolidaysPanelModel();

  usePageHeaderActions(
    () => (
      <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={m.openCreate} disabled={m.loading}>
        <Plus className="h-3.5 w-3.5" />
        إضافة عطلة رسمية
      </Button>
    ),
    [m.openCreate, m.loading],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">{m.listError}</p>
      ) : null}

      {m.loading && m.sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : m.sorted.length === 0 && !m.loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد عطل رسمية. ابدأ بإضافة عطلة جديدة.</p>
        </div>
      ) : (
        <DirectoryPagedViews items={m.sorted} serverPagination={m.pagination} loading={m.loading}>
          {(pageItems) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((item) => {
              const [, dd] = item.date.split('-');
              const monthName = MONTH_NAMES[(Number(item.date.split('-')[0]) || 1) - 1] ?? '';
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => m.openEdit(item)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.openEdit(item); } }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary opacity-0 blur-2xl transition-opacity group-hover:opacity-10" />
                  <div className="relative p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        'flex h-12 w-12 flex-col items-center justify-center rounded-xl',
                        item.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/60',
                      )}>
                        <span className="font-display text-lg font-bold leading-none">{dd}</span>
                        <span className="text-[9px] mt-0.5 font-medium">{monthName}</span>
                      </div>
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        item.isActive
                          ? 'border-success/30 bg-success/10 text-success'
                          : 'border-border bg-muted text-muted-foreground',
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', item.isActive ? 'bg-success' : 'bg-muted-foreground')} />
                        {item.isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold leading-snug mb-3 group-hover:text-primary transition-colors truncate">
                      {item?.nameAr ?? '—'}
                    </h3>
                    <div className="mb-4">
                      {item.recurring ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <RefreshCw className="h-2.5 w-2.5" />
                          يتكرر سنوياً
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          مرة واحدة
                        </span>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1 border-t border-border/60 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs" onClick={() => m.openEdit(item)}>
                        <Pencil className="h-3 w-3" /> تعديل
                      </Button>
                      <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive" onClick={() => m.setConfirmId(item.id)}>
                        <Trash2 className="h-3 w-3" /> حذف
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </DirectoryPagedViews>
      )}

      <Dialog open={m.open} onOpenChange={m.setOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{m.editId ? 'تعديل العطلة الرسمية' : 'إضافة عطلة رسمية'}</DialogTitle>
              <DialogDescription>التاريخ بصيغة MM-DD (الشهر-اليوم).</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>التاريخ <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn('w-full justify-start gap-2 text-sm', !m.draft.date && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      {m.draft.date
                        ? (() => {
                            const d = parse(`2000-${m.draft.date}`, 'yyyy-MM-dd', new Date());
                            return isValid(d) ? format(d, 'dd MMMM', { locale: arSA }) : m.draft.date;
                          })()
                        : 'اختر التاريخ'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={(() => {
                        const d = parse(`2000-${m.draft.date}`, 'yyyy-MM-dd', new Date());
                        return isValid(d) ? d : undefined;
                      })()}
                      onSelect={(day) => {
                        if (day) m.patch('date', format(day, 'MM-dd'));
                      }}
                      defaultMonth={(() => {
                        const d = parse(`2000-${m.draft.date}`, 'yyyy-MM-dd', new Date());
                        return isValid(d) ? d : new Date(2000, 0, 1);
                      })()}
                      fromYear={2000}
                      toYear={2000}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>الاسم <span className="text-destructive">*</span></Label>
                <Input value={m.draft.nameAr} onChange={(e) => m.patch('nameAr', e.target.value)} />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              {([
                ['recurring', 'تتكرر سنوياً (نفس الشهر واليوم)'],
                ['isActive', 'نشط'],
              ] as [keyof PublicHolidayDraft, string][]).map(([key, label]) => (
                <label key={key} className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all',
                  m.draft[key]
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/10 hover:border-border hover:bg-muted/20',
                )}>
                  <span className="text-sm font-medium">{label}</span>
                  <Checkbox checked={m.draft[key] as boolean} onCheckedChange={(v) => m.patch(key, v === true)} />
                </label>
              ))}
            </div>
            {m.error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">{m.error}</p>}
          </div>
          <DialogFooter className={dialogFormFooterClass}>
            <Button variant="luxe" type="button" onClick={() => void m.save()}>{m.editId ? 'حفظ التعديلات' : 'إضافة العطلة'}</Button>
            <Button variant="outline" type="button" onClick={() => m.setOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!m.confirmId} onOpenChange={(o) => !o && m.setConfirmId(null)}>
        <DialogContent className="border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف العطلة الرسمية</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذه العطلة؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => void m.remove()}>حذف</Button>
            <Button variant="outline" onClick={() => m.setConfirmId(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
