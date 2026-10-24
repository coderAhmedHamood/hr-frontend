'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField, HRSettingsFormDrawer } from '@/components/ui/shared-dialogs';
import { UserPicker } from '@/features/system/email/components/user-picker';
import { useCompanyUsersForEmail } from '@/features/system/email/hooks/useCompanyUsersForEmail';
import { emailMessagesApi, type SendDirectEmailResponse } from '@/features/system/email/lib/api/email-messages';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { cn } from '@/shared/utils';

const RESULT_LABELS: Record<string, string> = {
  sent: 'أُرسلت',
  failed: 'فشلت',
  skipped: 'تم تخطيها',
  no_email: 'بلا بريد إلكتروني',
  not_in_company: 'خارج نطاق الشركة',
  not_found: 'مستخدم غير موجود',
};

const RESULT_TONE: Record<string, 'success' | 'destructive' | 'subtle'> = {
  sent: 'success',
  failed: 'destructive',
  skipped: 'subtle',
  no_email: 'destructive',
  not_in_company: 'destructive',
  not_found: 'destructive',
};

/** `\n` → `<br>`, with the rest HTML-escaped — a plain-text compose box is all this needs. */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${escaped.replace(/\n/g, '<br>')}</p>`;
}

export function SendEmailDrawer({
  open,
  onOpenChange,
  companyId,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null | undefined;
  onSent?: () => void;
}) {
  const { options, isLoading: usersLoading } = useCompanyUsersForEmail(companyId);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SendDirectEmailResponse | null>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSubject('');
    setBody('');
    setFormError(null);
    setResult(null);
  }, [open]);

  const send = useMutation({
    mutationFn: () =>
      emailMessagesApi.sendDirect({
        companyId: companyId!,
        userIds: [...selected],
        subject: subject.trim(),
        bodyHtml: textToHtml(body),
        bodyText: body,
      }),
    onSuccess: (res) => {
      setResult(res);
      void queryClient.invalidateQueries({ queryKey: ['system-email', 'messages'] });
      if (res.failedCount === 0 && res.skippedCount === 0) {
        toast.success(`أُرسلت الرسالة إلى ${res.sentCount} مستخدم`);
      } else {
        toast.warning(
          `أُرسلت إلى ${res.sentCount} وفشلت/تُخطّت ${res.failedCount + res.skippedCount}`,
        );
      }
      onSent?.();
    },
    onError: (err) => {
      setFormError(handleApiError(err, 'system-email.send-direct').displayMessage);
    },
  });

  const submit = () => {
    if (!companyId) {
      setFormError('تعذر تحديد الشركة');
      return;
    }
    if (selected.size === 0) {
      setFormError('اختر مستخدماً واحداً على الأقل');
      return;
    }
    if (!subject.trim()) {
      setFormError('الموضوع مطلوب');
      return;
    }
    if (!body.trim()) {
      setFormError('نص الرسالة مطلوب');
      return;
    }
    setFormError(null);
    send.mutate();
  };

  return (
    <HRSettingsFormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="إرسال رسالة جديدة"
      description="رسالة حرة لمستخدمين محددين من هذه الشركة — ترسل فوراً عبر بريد المؤسسة."
      onSave={result ? () => onOpenChange(false) : submit}
      saveLabel={result ? 'إغلاق' : 'إرسال'}
      saveDisabled={send.isPending}
      error={formError}
    >
      {result ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="success">{result.sentCount} أُرسلت</Badge>
            {result.failedCount > 0 ? <Badge variant="destructive">{result.failedCount} فشلت</Badge> : null}
            {result.skippedCount > 0 ? <Badge variant="subtle">{result.skippedCount} تُخطّت</Badge> : null}
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border/70">
            {result.results.map((r) => {
              const option = options.find((o) => o.id === r.userId);
              return (
                <div
                  key={r.userId}
                  className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-2 text-sm last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{option?.name ?? r.userId}</p>
                    {r.email ? <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{r.email}</p> : null}
                  </div>
                  <Badge variant={RESULT_TONE[r.status] ?? 'subtle'} className="shrink-0">
                    {RESULT_LABELS[r.status] ?? r.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <FormField label="المستلمون" required>
            <UserPicker
              users={options}
              selected={selected}
              onChange={setSelected}
              loading={usersLoading}
              disabled={send.isPending}
            />
          </FormField>
          <FormField label="الموضوع" required>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع الرسالة"
              disabled={send.isPending}
            />
          </FormField>
          <FormField label="نص الرسالة" required>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              disabled={send.isPending}
              className={cn(
                'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              placeholder="اكتب نص الرسالة…"
            />
          </FormField>
        </>
      )}
    </HRSettingsFormDrawer>
  );
}
