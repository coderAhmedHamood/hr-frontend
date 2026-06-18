'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AllowanceTypeDto } from '@/features/hr/contracts/lib/api/allowance-types';

export type AllowanceLineDraft = {
  allowanceTypeId: string;
  amount: string;
  sortOrder: number;
};

type Props = {
  lines: AllowanceLineDraft[];
  allowanceTypes: AllowanceTypeDto[];
  onChange: (lines: AllowanceLineDraft[]) => void;
};

export function ContractTemplateAllowanceLinesEditor({ lines, allowanceTypes, onChange }: Props) {
  const usedTypeIds = React.useMemo(
    () => new Set(lines.map((l) => l.allowanceTypeId).filter(Boolean)),
    [lines],
  );

  const optionsForLine = React.useCallback(
    (lineIndex: number) => {
      const currentId = lines[lineIndex]?.allowanceTypeId;
      return allowanceTypes.filter(
        (t) => t.id === currentId || !usedTypeIds.has(t.id),
      );
    },
    [allowanceTypes, lines, usedTypeIds],
  );

  const firstUnusedTypeId = React.useCallback(() => {
    const used = new Set(lines.map((l) => l.allowanceTypeId).filter(Boolean));
    return allowanceTypes.find((t) => !used.has(t.id))?.id ?? '';
  }, [allowanceTypes, lines]);

  const canAddLine = allowanceTypes.some(
    (t) => !usedTypeIds.has(t.id),
  );

  const addLine = () => {
    const nextId = firstUnusedTypeId();
    if (!nextId) return;
    onChange([...lines, { allowanceTypeId: nextId, amount: '', sortOrder: lines.length }]);
  };

  const patchLine = (index: number, patch: Partial<AllowanceLineDraft>) => {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLine = (index: number) => {
    onChange(lines.filter((_, i) => i !== index).map((l, i) => ({ ...l, sortOrder: i })));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">بدلات القالب</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={addLine}
          disabled={allowanceTypes.length === 0 || !canAddLine}
        >
          <Plus className="h-3 w-3" /> إضافة بدل
        </Button>
      </div>

      {allowanceTypes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          لا توجد أنواع بدلات — أضفها من صفحة «أنواع البدلات» أولاً.
        </p>
      ) : lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          لم تُضف بدلات بعد. اختياري.
        </p>
      ) : (
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div
              key={`${line.allowanceTypeId}-${index}`}
              className="flex items-end gap-2 rounded-lg border border-border bg-muted/20 p-2"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground">نوع البدل</Label>
                <Select
                  value={line.allowanceTypeId || undefined}
                  onValueChange={(v) => patchLine(index, { allowanceTypeId: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="اختر نوع البدل" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsForLine(index).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-[10px] text-muted-foreground">المبلغ</Label>
                <Input
                  type="number"
                  min={0}
                  value={line.amount}
                  onChange={(e) => patchLine(index, { amount: e.target.value })}
                  className="h-8 text-xs"
                  dir="ltr"
                  placeholder="0"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
