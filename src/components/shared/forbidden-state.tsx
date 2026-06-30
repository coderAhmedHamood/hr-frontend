'use client';

import { ShieldOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/shared-dialogs';

export function ForbiddenState({
  title = 'لا تملك صلاحية الوصول',
  description = 'تواصل مع مسؤول النظام إذا كنت تعتقد أن هذا خطأ.',
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState icon={ShieldOff} title={title} description={description} />;
}
