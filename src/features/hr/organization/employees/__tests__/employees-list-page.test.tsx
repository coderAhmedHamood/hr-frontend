/**
 * @jest-environment jsdom
 *
 * Strategy: mock `useEmployeesListModel` with the exact shape it returns
 * so the view renders with controlled data, isolated from API/context.
 */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── mocks ────────────────────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const emp1 = {
  id: 'e1', nameAr: 'أحمد علي', nameEn: 'Ahmed Ali', employeeCode: 'EMP-001',
  status: 'active', startDate: '2023-01-15', departmentId: 'd1', branchId: 'b1',
  nationalId: '1234567890', jobTitleId: null, email: null, phone: null,
  nationality: 'سعودي', gender: 'male', companyId: 'company-1', createdAt: '', updatedAt: '',
};
const emp2 = {
  id: 'e2', nameAr: 'سارة محمد', nameEn: 'Sara Mohammed', employeeCode: 'EMP-002',
  status: 'active', startDate: '2023-03-10', departmentId: 'd1', branchId: 'b1',
  nationalId: '0987654321', jobTitleId: null, email: null, phone: null,
  nationality: 'سعودية', gender: 'female', companyId: 'company-1', createdAt: '', updatedAt: '',
};

const baseModel = {
  router: { push: jest.fn() },
  employees: [emp1, emp2],
  filtered: [emp1, emp2],
  loading: false,
  listError: null,
  view: 'table' as const,
  newEmpOpen: false,
  setNewEmpOpen: jest.fn(),
  pdfOpen: false,
  setPdfOpen: jest.fn(),
  employeesPrintable: null,
  getBranch: jest.fn().mockReturnValue({ nameAr: 'الفرع الرئيسي' }),
  getDepartment: jest.fn().mockReturnValue({ nameAr: 'الموارد البشرية' }),
  reloadEmployees: jest.fn(),
};

jest.mock(
  '@/features/hr/organization/employees/hooks/useEmployeesListModel',
  () => ({ useEmployeesListModel: () => baseModel }),
);

// Import after mocks
import EmployeesListPage from '@/features/hr/organization/employees/components/employees-list-page';

function renderPage() {
  return render(<EmployeesListPage />);
}

// ─── tests ────────────────────────────────────────────────────────────────────
describe('EmployeesListPage', () => {
  it('renders without crashing', () => {
    renderPage();
    expect(document.body).toBeTruthy();
  });

  it('displays employee names', () => {
    renderPage();
    expect(screen.getByText('أحمد علي')).toBeInTheDocument();
    expect(screen.getByText('سارة محمد')).toBeInTheDocument();
  });

  it('displays employee codes', () => {
    renderPage();
    expect(screen.getByText((t) => t.includes('EMP-001'))).toBeInTheDocument();
    expect(screen.getByText((t) => t.includes('EMP-002'))).toBeInTheDocument();
  });

  it('shows an empty state when filtered list is empty', () => {
    jest
      .spyOn(
        require('@/features/hr/organization/employees/hooks/useEmployeesListModel'),
        'useEmployeesListModel',
      )
      .mockReturnValue({ ...baseModel, filtered: [] });
    renderPage();
    // table body should be empty — no employee names present
    expect(screen.queryByText('أحمد علي')).toBeNull();
  });

  it('shows error message when listError is set', () => {
    jest
      .spyOn(
        require('@/features/hr/organization/employees/hooks/useEmployeesListModel'),
        'useEmployeesListModel',
      )
      .mockReturnValue({ ...baseModel, listError: 'تعذر تحميل الموظفين', employees: [], filtered: [] });
    renderPage();
    expect(screen.getByText('تعذر تحميل الموظفين')).toBeInTheDocument();
  });
});
