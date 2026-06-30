'use client';

import { Plus, Pencil, Trash2, Check, Minus, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { useLeaveTypesPanelModel, getLeaveTypeProperty, type LeaveTypeProperty } from '@/features/hr/leaves/leave-types/hooks/useLeaveTypesPanelModel';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { cn } from '@/shared/utils';

export function LeaveTypesPanel() {
  const m = useLeaveTypesPanelModel();

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={m.openCreate} disabled={m.loading}>
          <Plus className="h-3.5 w-3.5" />
          إضافة نوع إجازة
        </Button>
      </div>
    ),
    [m.openCreate, m.loading],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">{m.listError}</p>
      ) : null}

      {m.loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : m.sorted.length === 0 && !m.loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <FileCheck className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد أنواع إجازة. ابدأ بإضافة نوع جديد.</p>
        </div>
      ) : (
        <DirectoryPagedViews items={m.sorted} serverPagination={m.pagination} loading={m.loading}>
          {(pageItems) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((item) => (
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-display text-base font-bold leading-snug mb-3 group-hover:text-primary transition-colors truncate">
                    {item?.nameAr ?? '—'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      item.paid ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                    )}>
                      {item.paid ? <Check className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                      مدفوعة
                    </span>
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      item.deductsFromBalance ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground',
                    )}>
                      {item.deductsFromBalance ? <Check className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                      يخصم من الرصيد
                    </span>
                    {item.maxDaysPerRequest !== null && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        حد: {item.maxDaysPerRequest} أيام
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 border-t border-border/60 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs" onClick={() => m.openEdit(item)}>
                      <Pencil className="h-3 w-3" /> تعديل
                    </Button>
                    <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive" onClick={() => m.setConfirmId(item.id)}>
                      <Trash2 className="h-3 w-3" /> حذف
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </DirectoryPagedViews>
      )}

      <Dialog open={m.open} onOpenChange={m.setOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{m.editId ? 'تعديل نوع الإجازة' : 'إضافة نوع إجازة'}</DialogTitle>
              <DialogDescription>حدّد خصائص نوع الإجازة والقيود المرتبطة به.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lt-name-ar">الاسم <span className="text-destructive">*</span></Label>
              <Input id="lt-name-ar" value={m.draft.nameAr} onChange={(e) => m.patch('nameAr', e.target.value)} />
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-semibold">الخصائص</p>
              <div className="space-y-2" role="radiogroup" aria-label="خصائص نوع الإجازة">
                {([
                  ['paid', 'إجازة مدفوعة الأجر'],
                  ['deductsFromBalance', 'يخصم من رصيد الإجازات'],
                ] as [LeaveTypeProperty, string][]).map(([value, label]) => {
                  const selected = getLeaveTypeProperty(m.draft) === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all',
                        selected
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-muted/10 hover:border-border hover:bg-muted/20',
                      )}
                    >
                      <span className="text-sm font-medium">{label}</span>
                      <input
                        type="radio"
                        name="leave-type-property"
                        value={value}
                        checked={selected}
                        onChange={() => m.setProperty(value)}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            {m.error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">{m.error}</p>}
          </div>
          <DialogFooter className={dialogFormFooterClass}>
            <Button variant="luxe" type="button" onClick={() => void m.save()}>{m.editId ? 'حفظ التعديلات' : 'إضافة النوع'}</Button>
            <Button variant="outline" type="button" onClick={() => m.setOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!m.confirmId} onOpenChange={(o) => !o && m.setConfirmId(null)}>
        <DialogContent className="border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف نوع الإجازة</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذا النوع؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
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
