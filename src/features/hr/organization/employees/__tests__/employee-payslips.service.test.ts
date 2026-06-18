import {
  mapEmployeePayslipHistoryItem,
  mapPayslipListItem,
} from '@/features/hr/organization/employees/services/employee-payslips.service';

describe('employee-payslips.service', () => {
  it('maps history item status from payslip status', () => {
    const payslip = mapEmployeePayslipHistoryItem(
      {
        id: 'p1',
        status: 'paid',
        net: '14000.00',
        gross: '15000.00',
        workingDays: 22,
        presentDays: 20,
        absentDays: 1,
        lateDays: 1,
        payrollPeriod: {
          id: 'period-1',
          periodYear: 2026,
          periodMonth: 6,
          status: 'draft',
        },
      },
      'emp-1',
    );

    expect(payslip.status).toBe('paid');
    expect(payslip.month).toBe('يونيو');
    expect(payslip.net).toBe(14000);
  });

  it('falls back to payroll period status when payslip status is missing', () => {
    const payslip = mapEmployeePayslipHistoryItem(
      {
        id: 'p2',
        net: '14000.00',
        payrollPeriod: {
          id: 'period-2',
          periodYear: 2026,
          periodMonth: 5,
          status: 'approved',
        },
      },
      'emp-1',
    );

    expect(payslip.status).toBe('approved');
  });

  it('maps list item status from PayslipResponseDto', () => {
    const payslip = mapPayslipListItem({
      id: 'p3',
      companyId: 'c1',
      payrollPeriodId: 'period-3',
      periodYear: 2026,
      periodMonth: 4,
      employeeId: 'emp-1',
      employeeNameAr: 'موظف',
      contractId: null,
      contractNumber: null,
      baseSalary: '10000',
      allowancesTotal: '0',
      additionsTotal: '0',
      deductionsTotal: '0',
      gosi: '0',
      gross: '10000',
      net: '10000',
      currency: 'SAR',
      workingDays: 22,
      presentDays: 22,
      absentDays: 0,
      lateDays: 0,
      breakdown: null,
      generatedAt: null,
      status: 'draft',
      acceptanceStatus: 'pending',
      acceptanceAt: null,
      acceptanceNote: null,
      notes: null,
      createdAt: '',
      updatedAt: '',
      createdBy: null,
      updatedBy: null,
    });

    expect(payslip.status).toBe('draft');
  });
});
