'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { listCmsContactMessages } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

export function ContactMessagesPage() {
  const companyId = getStorefrontCompanyId();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cms', 'contact-messages', companyId],
    queryFn: () => listCmsContactMessages(companyId, { page: 1, limit: 50 }),
  });

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="رسائل التواصل"
        descriptionAr="رسائل نموذج التواصل من واجهة المتجر"
        iconName="Mail"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm">
          <p className="text-destructive">تعذر تحميل الرسائل.</p>
          <button type="button" className="mt-2 text-primary underline" onClick={() => refetch()}>
            إعادة المحاولة
          </button>
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <Mail className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">لا توجد رسائل بعد.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data!.items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {[item.email, item.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground" dir="ltr">
                  {new Date(item.createdAt).toLocaleString('ar-YE')}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {item.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
