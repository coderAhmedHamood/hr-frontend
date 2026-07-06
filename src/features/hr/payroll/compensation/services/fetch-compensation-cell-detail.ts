import { employeeAdvancesApi } from '@/features/hr/contracts/lib/api/employee-advances';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  monthlyInputsApi,
  type MonthlyInputKindDto,
} from '@/features/hr/payroll/lib/api/monthly-inputs';
import type {
  CompensationCellDetailContext,
  CompensationCellDetailResult,
} from '@/features/hr/payroll/compensation/lib/compensation-cell-detail';

async function listMonthlyInputsForEmployee(
  context: CompensationCellDetailContext,
  inputKind: MonthlyInputKindDto | MonthlyInputKindDto[],
) {
  const kinds = Array.isArray(inputKind) ? inputKind : [inputKind];
  const responses = await Promise.all(
    kinds.map((kind) =>
      monthlyInputsApi.list({
        companyId: context.companyId,
        payrollPeriodId: context.periodId,
        employeeId: context.row.employeeId,
        inputKind: kind,
        limit: 200,
      }),
    ),
  );
  return responses.flatMap((res) => res.items);
}

function byPeriodQuery(context: CompensationCellDetailContext) {
  return {
    employeeId: context.row.employeeId,
    companyId: context.companyId,
    startDate: context.periodStartDate,
    endDate: context.periodEndDate,
  };
}

export async function fetchCompensationCellDetail(
  context: CompensationCellDetailContext,
): Promise<CompensationCellDetailResult> {
  const { field } = context;

  if (field === 'baseSalary') return { kind: 'baseSalary' };
  if (field === 'allowances') return { kind: 'allowances' };
  if (field === 'net') return { kind: 'net' };

  if (field === 'advances') {
    const response = await employeeAdvancesApi.list({
      companyId: context.companyId,
      employeeId: context.row.employeeId,
      page: 1,
      limit: 100,
    });
    return {
      kind: 'advances',
      items: response.items,
    };
  }

  if (field === 'absence') {
    const res = await attendanceDaySummariesApi.absentDaysByPeriod(byPeriodQuery(context));
    return {
      kind: 'absence',
      days: res.items,
    };
  }

  if (field === 'lateness') {
    const res = await attendanceDaySummariesApi.lateDaysByPeriod(byPeriodQuery(context));
    return {
      kind: 'lateness',
      days: res.items,
    };
  }

  if (field === 'overtime') {
    const res = await attendanceDaySummariesApi.overtimeDaysByPeriod(byPeriodQuery(context));
    return {
      kind: 'overtime',
      days: res.items,
    };
  }

  if (field === 'penalties') {
    const res = await violationRecordsApi.byPeriod(byPeriodQuery(context));
    return {
      kind: 'penalties',
      violations: res.items.filter((v) => v.status === 'approved'),
    };
  }

  if (field === 'bonus') {
    const items = await listMonthlyInputsForEmployee(context, 'bonus');
    return { kind: 'bonus', items };
  }

  const items = await listMonthlyInputsForEmployee(
    context,
    ['other_addition', 'other_deduction', 'gosi_adjustment'],
  );
  return { kind: 'admin', items };
}
