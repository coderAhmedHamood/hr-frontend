import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Package } from 'lucide-react';
import { PageHeaderActionsProvider } from '@/components/layouts/page-header-actions-context';
import type { ColumnDef } from '@/components/ui/data-table';
import {
  DirectoryGridCard,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { AccountingDirectoryViews } from '@/features/accounting/_shared/components/accounting-directory-views';

type Row = { id: string; name: string };

const rows = Array.from({ length: 31 }, (_, index) => ({
  id: String(index + 1),
  name: `سجل ${index + 1}`,
}));

const columns = (requestDelete: (id: string) => void): ColumnDef<Row>[] => [
  { key: 'name', title: 'الاسم', render: (row) => row.name },
  {
    key: 'actions',
    title: 'إجراءات',
    isActions: true,
    render: (row) => (
      <button type="button" onClick={() => requestDelete(row.id)}>
        حذف {row.name}
      </button>
    ),
  },
];

function renderDirectory({
  view = 'table',
  items = rows,
  onOpen = jest.fn(),
  onDelete = jest.fn(),
}: {
  view?: 'table' | 'grid';
  items?: Row[];
  onOpen?: (row: Row) => void;
  onDelete?: (id: string) => void;
} = {}) {
  render(
    <PageHeaderActionsProvider>
      <AccountingDirectoryViews
        items={items}
        view={view}
        columns={columns}
        getId={(row) => row.id}
        onOpen={onOpen}
        onDelete={onDelete}
        renderCard={(row, actions) => (
          <DirectoryGridCard interactive onClick={actions.open}>
            <DirectoryGridCardTitle>{row.name}</DirectoryGridCardTitle>
            <button type="button" onClick={actions.requestDelete}>حذف البطاقة</button>
          </DirectoryGridCard>
        )}
        emptyIcon={Package}
        emptyTitle="لا توجد نتائج"
        deleteTitle="تأكيد حذف السجل"
        deleteDescription="لا يمكن التراجع"
        deleteConfirmLabel="تأكيد الحذف"
      />
    </PageHeaderActionsProvider>,
  );
}

describe('AccountingDirectoryViews', () => {
  it('renders the directory table and opens a clicked row', async () => {
    const onOpen = jest.fn();
    renderDirectory({ onOpen });

    await userEvent.click(screen.getByText('سجل 1'));

    expect(onOpen).toHaveBeenCalledWith(rows[0]);
    expect(screen.getByRole('navigation', { name: 'التصفح بين الصفحات' })).toBeInTheDocument();
  });

  it('paginates through the shared sticky pagination bar', async () => {
    renderDirectory();

    expect(screen.queryByText('سجل 31')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('سجل 31')).toBeInTheDocument();
  });

  it('renders cards and confirms deletion', async () => {
    const onDelete = jest.fn();
    renderDirectory({ view: 'grid', items: rows.slice(0, 1), onDelete });

    await userEvent.click(screen.getByRole('button', { name: 'حذف البطاقة' }));
    expect(screen.getByText('تأكيد حذف السجل')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'تأكيد الحذف' }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('renders the shared empty state', () => {
    renderDirectory({ items: [] });
    expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument();
  });
});
