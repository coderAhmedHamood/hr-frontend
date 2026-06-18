'use client';

import * as React from 'react';
import { Banknote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EmployeePicker } from '@/components/ui/employee-picker';
import type { CompensationAdvancesPushOptions } from '@/features/hr/payroll/lib/compensation-preview';

type EmployeeScope = 'all' | 'selected';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pushing: boolean;
  disabled?: boolean;
  employees: { id: string; name: string }[];
  defaultEmployeeIds?: string[];
  onConfirm: (options: CompensationAdvancesPushOptions) => void;
};

function InlineSwitchRow({
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 text-right">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
      />
    </div>
  );
}

export function PushFromAdvancesDialog({
  open,
  onOpenChange,
  pushing,
  disabled = false,
  employees,
  defaultEmployeeIds = [],
  onConfirm,
}: Props) {
  const [replaceExisting, setReplaceExisting] = React.useState(true);
  const [scope, setScope] = React.useState<EmployeeScope>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const defaultIdsKey = React.useMemo(
    () => [...defaultEmployeeIds].sort().join(','),
    [defaultEmployeeIds],
  );
  const initialEmpIds = React.useMemo(
    () => new Set(defaultIdsKey ? defaultIdsKey.split(',') : []),
    [defaultIdsKey],
  );
  const allEmployeeIds = React.useMemo(
    () => employees.map(e => e.id),
    [employees],
  );

  React.useEffect(() => {
    if (!open) return;
    setReplaceExisting(true);
    setScope(initialEmpIds.size > 0 ? 'selected' : 'all');
    setSelectedEmpIds(new Set(initialEmpIds));
  }, [open, initialEmpIds]);

  const applyPageFilter = () => {
    if (initialEmpIds.size === 0) {
      toast.message('لا يوجد موظفون محددون في فلتر الصفحة.');
      return;
    }
    setScope('selected');
    setSelectedEmpIds(new Set(initialEmpIds));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const employeeIds =
      scope === 'all'
        ? allEmployeeIds
        : [...selectedEmpIds];

    if (employeeIds.length === 0) {
      toast.error('يرجى اختيار موظف واحد على الأقل، أو اختر «جميع الموظفين».');
      return;
    }

    onConfirm({ replaceExisting, employeeIds });
  };

  const fieldDisabled = disabled || pushing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-destructive/5 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="font-display text-lg leading-tight">
                  دفع السلف إلى المدخلات الشهرية
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                  يُنشئ خصم قسط السلفة لكل سلفة مؤهلة في فترة الراتب، ويحدّث المبلغ المسدّد وحالة السلفة.
                </DialogDescription>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
                <Banknote className="h-4 w-4" />
              </span>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[min(70vh,520px)] overflow-y-auto px-6 py-2">
            <section className="rounded-xl border border-border/60 bg-card shadow-soft">
              <p className="border-b border-border/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                نطاق الموظفين
              </p>
              <div className="space-y-3 px-4 py-3">
                <div className="space-y-2">
                  <Label>تطبيق الدفع على</Label>
                  <Select
                    value={scope}
                    disabled={fieldDisabled}
                    onValueChange={v => setScope(v as EmployeeScope)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الموظفين ({employees.length})</SelectItem>
                      <SelectItem value="selected">موظفون محددون</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {scope === 'selected' ? (
                  <div className="space-y-2">
                    <EmployeePicker
                      variant="form"
                      selectionMode="target"
                      employees={employees}
                      selected={selectedEmpIds}
                      onChange={setSelectedEmpIds}
                    />
                    {initialEmpIds.size > 0 ? (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary"
                        disabled={fieldDisabled}
                        onClick={applyPageFilter}
                      >
                        استخدام فلتر الصفحة الحالي ({initialEmpIds.size})
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    يُرحَّل قسط السلفة لكل موظف له سلفة مؤهلة ضمن الموظفين المحددين.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-border/60 bg-card shadow-soft">
              <p className="border-b border-border/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                خيارات الدفع
              </p>
              <div className="divide-y divide-border/50 px-4">
                <InlineSwitchRow
                  label="استبدال المدخلات السابقة"
                  hint="إعادة احتساب أقساط السلف المُرحّلة سابقاً لنفس الفترة"
                  checked={replaceExisting}
                  disabled={fieldDisabled}
                  onCheckedChange={setReplaceExisting}
                />
              </div>
            </section>
          </div>

          <DialogFooter className={dialogFormFooterClass}>
            <Button type="submit" disabled={fieldDisabled} className="min-w-[7.5rem] gap-1.5">
              {pushing && <Loader2 className="h-4 w-4 animate-spin" />}
              تنفيذ الدفع
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pushing}
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
