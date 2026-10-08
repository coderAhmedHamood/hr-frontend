'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Ban, Check, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpensesStore } from '../data/store';
import { decideTxn, submitTxn, voidTxn } from '../domain/commands';
import { canDecide, canVoid } from '../domain/policy';
import type { AnyTxn } from '../domain/types';
import { ReasonDialog } from './common';
import { useExpensesData, useExpensesPermissions } from './expenses-provider';

/**
 * Submit / approve / reject / void for any record. Two checks: the real ERP
 * permission (exp.*) of the signed-in user, and the simulated actor's role
 * (approver, not the creator).
 */
export function TxnActions({ txn, compact }: { txn: AnyTxn; compact?: boolean }) {
  const data = useExpensesData();
  const actorId = useExpensesStore((s) => s.actorId);
  const run = useExpensesStore((s) => s.run);
  const perms = useExpensesPermissions();
  const [dialog, setDialog] = React.useState<'reject' | 'void' | null>(null);
  if (!data || !actorId) return null;

  const attempt = (fn: () => void, ok: string) => {
    try {
      fn();
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر التنفيذ');
    }
  };
  const mayDecide = canDecide(actorId, txn, data.settings);
  const size = compact ? 'sm' : 'default';

  return (
    <div className="flex flex-wrap gap-1.5">
      {(txn.status === 'draft' || txn.status === 'rejected') && txn.createdBy === actorId ? (
        <Button size={size} onClick={() => attempt(() => run((d, ctx) => submitTxn(d, txn.kind, txn.id, ctx)), 'أُرسلت')}>
          <Send className="me-1.5 h-4 w-4" />
          إرسال
        </Button>
      ) : null}
      {txn.status === 'submitted' ? (
        mayDecide && perms.approve ? (
          <>
            <Button size={size} onClick={() => attempt(() => run((d, ctx) => decideTxn(d, txn.kind, txn.id, 'approved', null, ctx)), 'اعتُمدت')}>
              <Check className="me-1.5 h-4 w-4" />
              اعتماد
            </Button>
            <Button size={size} variant="outline" onClick={() => setDialog('reject')}>
              <X className="me-1.5 h-4 w-4" />
              رفض
            </Button>
          </>
        ) : (
          <span className="self-center text-xs text-muted-foreground">
            {!perms.approve ? 'لا تملك صلاحية الاعتماد (exp.expenses.approve)' : txn.createdBy === actorId ? 'لا تعتمد عملية سجّلتها' : 'بانتظار معتمِد آخر'}
          </span>
        )
      ) : null}
      {canVoid(txn) && perms.void && txn.status === 'approved' ? (
        <Button size={size} variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDialog('void')}>
          <Ban className="me-1.5 h-4 w-4" />
          إلغاء
        </Button>
      ) : null}
      <ReasonDialog
        open={dialog === 'reject'}
        onOpenChange={(o) => setDialog(o ? 'reject' : null)}
        title="رفض العملية"
        confirmLabel="رفض"
        destructive
        onConfirm={(reason) => {
          attempt(() => run((d, ctx) => decideTxn(d, txn.kind, txn.id, 'rejected', reason, ctx)), 'رُفضت');
          setDialog(null);
        }}
      />
      <ReasonDialog
        open={dialog === 'void'}
        onOpenChange={(o) => setDialog(o ? 'void' : null)}
        title="إلغاء العملية (تبقى في السجل وتخرج من الأرصدة)"
        confirmLabel="إلغاء العملية"
        destructive
        onConfirm={(reason) => {
          attempt(() => run((d, ctx) => voidTxn(d, txn.kind, txn.id, reason, ctx)), 'أُلغيت');
          setDialog(null);
        }}
      />
    </div>
  );
}
