import { buildAssignedBranchByEmployeeId } from '@/features/hr/attendance/lib/use-assigned-branch-filter';

describe('buildAssignedBranchByEmployeeId', () => {
  it('maps each employee to the assigned branch name', () => {
    const map = buildAssignedBranchByEmployeeId([
      { branchNameAr: 'صنعاء', employeeIds: ['e1', 'e2'] },
      { branchNameAr: 'عدن', employeeIds: ['e3'] },
    ]);
    expect(map.get('e1')).toBe('صنعاء');
    expect(map.get('e2')).toBe('صنعاء');
    expect(map.get('e3')).toBe('عدن');
    expect(map.get('missing')).toBeUndefined();
  });

  it('skips a branch with an empty name', () => {
    const map = buildAssignedBranchByEmployeeId([
      { branchNameAr: '   ', employeeIds: ['e1'] },
    ]);
    expect(map.size).toBe(0);
  });
});
