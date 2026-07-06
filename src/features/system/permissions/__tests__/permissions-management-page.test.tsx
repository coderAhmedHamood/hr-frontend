/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PermissionsManagementPage } from '@/features/system/permissions/components/permissions-management-page';

// ─── mocks ────────────────────────────────────────────────────────────────────
jest.mock('@/features/auth/lib/auth-store', () => ({
  useAuthStore: (sel: (s: { activeCompanyId: string }) => unknown) =>
    sel({ activeCompanyId: 'company-1' }),
}));

jest.mock('@/components/layouts/page-title-context', () => ({
  useSetPageTitle: jest.fn(),
}));

jest.mock('@/components/layouts/page-header-actions-context', () => ({
  usePageHeaderActions: jest.fn(),
}));

jest.mock('@/components/layouts/entity-filter-slot-context', () => ({
  useEntityFilterSlot: jest.fn(),
}));

const mockRoles = [
  {
    id: 'r1', nameAr: 'مدير الموارد البشرية', nameEn: 'HR Manager',
    code: 'hr_manager', description: 'يدير الموارد البشرية',
    isSystem: false, isDefault: false, status: 'active', isActive: true,
    companyId: 'company-1', applicationId: 'app-1', createdAt: '', updatedAt: '',
  },
];

jest.mock('@/features/system/permissions/hooks/useRoles', () => ({
  useRoles: () => ({ data: { items: mockRoles }, isLoading: false }),
}));

const mockPermissions = [
  {
    id: 'perm-read',
    applicationId: 'app-1',
    code: 'hr.employees.read',
    nameAr: 'عرض الموظفين',
    nameEn: 'View employees',
    nodeType: 'ACTION' as const,
    action: 'read',
    resource: 'employees',
    parentId: null,
    sortOrder: 0,
    isSystem: false,
    status: 'active',
  },
  {
    id: 'perm-create',
    applicationId: 'app-1',
    code: 'hr.employees.create',
    nameAr: 'إنشاء موظف',
    nameEn: 'Create employee',
    nodeType: 'ACTION' as const,
    action: 'create',
    resource: 'employees',
    parentId: null,
    sortOrder: 1,
    isSystem: false,
    status: 'active',
  },
];

jest.mock('@/features/system/permissions/hooks/usePermissions', () => {
  const actual = jest.requireActual('@/features/system/permissions/hooks/usePermissions');
  return {
    ...actual,
    usePermissions: () => ({
      data: { items: mockPermissions, applicationId: 'app-1' },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    }),
  };
});

jest.mock('@/features/system/permissions/hooks/useApplicationId', () => ({
  useApplicationId: () => ({ applicationId: 'app-1', isLoading: false }),
}));

jest.mock('@/features/system/permissions/hooks/useRolePermissionsMap', () => ({
  useRolePermissionsMap: () => ({ grantedMap: { r1: [] }, isLoading: false }),
}));

jest.mock('@/features/auth/lib/auth-store', () => ({
  useAuthStore: (sel: (s: { activeCompanyId: string }) => unknown) =>
    sel({ activeCompanyId: 'company-1' }),
}));

const mockCreateRole = jest.fn().mockResolvedValue(undefined);
const mockUpdateRole = jest.fn().mockResolvedValue(undefined);

jest.mock('@/features/system/permissions/hooks/useRolesMutations', () => ({
  useRolesMutations: () => ({
    create: { mutateAsync: mockCreateRole, isPending: false },
    update: { mutateAsync: mockUpdateRole, isPending: false },
    remove: { mutateAsync: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/features/system/permissions/services/roles.service', () => ({
  loadRoleForEdit: jest.fn().mockResolvedValue({
    id: 'r1', name: 'مدير الموارد البشرية', description: 'يدير الموارد البشرية', permissionIds: [],
  }),
  resolvePermissionIds: jest.fn().mockReturnValue([]),
  resolvePermissionKeys: jest.fn().mockReturnValue([]),
}));

// ─── helper ───────────────────────────────────────────────────────────────────
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PermissionsManagementPage />
    </QueryClientProvider>,
  );
}

// ─── tests ────────────────────────────────────────────────────────────────────
describe('PermissionsManagementPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the page via layout title context', () => {
    renderPage();
    expect(screen.getByText('مدير الموارد البشرية')).toBeInTheDocument();
  });

  it('renders the add-role button in header', () => {
    renderPage();
    expect(screen.getAllByRole('button', { name: /إضافة دور/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('displays a role card for each fetched role', () => {
    renderPage();
    expect(screen.getByText('مدير الموارد البشرية')).toBeInTheDocument();
  });

  it('opens create panel when "إضافة دور" is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getAllByRole('button', { name: /إضافة دور/i })[0]);
    await waitFor(() => {
      expect(screen.getByText('دور جديد')).toBeInTheDocument();
    });
  });

  it('opens edit panel when a role card is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('مدير الموارد البشرية'));
    await waitFor(() => {
      expect(screen.getByText(/تعديل:/i)).toBeInTheDocument();
    });
  });

  it('opens delete dialog when card delete button is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /حذف مدير الموارد البشرية/i }));
    await waitFor(() => {
      expect(screen.getByText(/هل أنت متأكد من حذف/i)).toBeInTheDocument();
    });
  });

  it('displays the "إضافة دور جديد" placeholder card', () => {
    renderPage();
    expect(screen.getByText('إضافة دور جديد')).toBeInTheDocument();
  });

  it('creates role with selected permission ids from GET /permissions matrix', async () => {
    renderPage();
    await userEvent.click(screen.getAllByRole('button', { name: /إضافة دور/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('دور جديد')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText('مثال: مشرف الفرع'), 'مشرف الفرع');
    await userEvent.click(screen.getByRole('button', { name: 'عرض الموظفين' }));
    await userEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/i }));

    await waitFor(() => {
      expect(mockCreateRole).toHaveBeenCalledWith({
        name: 'مشرف الفرع',
        description: '',
        permissionIds: ['perm-read'],
      });
    });
  });
});
