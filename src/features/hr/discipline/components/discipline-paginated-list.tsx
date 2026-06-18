'use client';

import type { ReactNode } from 'react';
import {
  PaginatedListShell,
  PagedListViewport,
  type PaginationBarState,
} from '@/components/ui/paged-list';

export type { PaginationBarState as DisciplinePaginationState };

export { PagedListViewport as DisciplineListViewport };

interface DisciplinePaginatedListProps {
  pagination: PaginationBarState;
  children: ReactNode;
}

export function DisciplinePaginatedList({ pagination, children }: DisciplinePaginatedListProps) {
  return <PaginatedListShell pagination={pagination}>{children}</PaginatedListShell>;
}
