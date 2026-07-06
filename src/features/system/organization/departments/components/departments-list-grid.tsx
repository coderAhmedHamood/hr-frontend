'use client';

import * as React from 'react';
import { Pencil, Trash2, ChevronRight, Building2, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/components/ui/shared-dialogs';
import type { HRDepartmentEntity } from '@/features/hr/requests/lib/types';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardDecoration,
  DirectoryGridCardEyebrow,
  DirectoryGridCardFooter,
  DirectoryGridCardHeading,
  DirectoryGridCardIconWrap,
  DirectoryGridCardMetaChips,
} from '@/components/ui/directory-grid-card';
import type { DepartmentRecord } from '@/features/system/organization/departments/constants/departments-directory';

type FlatNode = { dept: HRDepartmentEntity; depth: number };

type DepartmentsListGridProps = {
  departments: DepartmentRecord[];
  filtered: FlatNode[];
  branchLabel?: (branchId: string) => string | undefined;
  companyLabel?: (companyId: string) => string;
  canUpdate?: boolean;
  canDelete?: boolean;
  onEdit: (dept: HRDepartmentEntity) => void;
  onDelete: (id: string) => void;
};

export function DepartmentsListGrid({
  departments,
  filtered,
  branchLabel,
  companyLabel,
  canUpdate = false,
  canDelete = false,
  onEdit,
  onDelete,
}: DepartmentsListGridProps) {
  return (
    <DirectoryGrid variant="wide">
      {filtered.map(({ dept, depth }) => {
        const record = dept as DepartmentRecord;
        const parent = departments.find((d) => d.id === dept.parentId);
        const subDepts = departments.filter((d) => d.parentId === dept.id);
        const branchName = branchLabel?.(record.branchId);
        return (
          <DirectoryGridCard
            key={dept.id}
            interactive={canUpdate}
            hoverLift={canUpdate}
            onClick={canUpdate ? () => onEdit(dept) : undefined}
            className="p-3.5 space-y-1.5"
          >
            <DirectoryGridCardDecoration />
            <div className="relative mb-2 flex items-start justify-between">
              <DirectoryGridCardIconWrap active={dept.isActive} className="h-7 w-7">
                <Building2 className="h-4 w-4" />
              </DirectoryGridCardIconWrap>
              <ActiveBadge active={dept.isActive} />
            </div>

            <div className="relative mb-2">
              {parent && (
                <DirectoryGridCardEyebrow>
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{parent.nameAr}</span>
                </DirectoryGridCardEyebrow>
              )}
              <DirectoryGridCardHeading className="text-sm">{dept.nameAr}</DirectoryGridCardHeading>
            </div>

            {record.description ? (
              <p className="relative mb-1   text-xs text-muted-foreground">{record.description}</p>
            ) : null}

            <DirectoryGridCardMetaChips className="pt-0.5 pb-1 gap-2">
              {companyLabel ? (
                <Badge variant="secondary" className="text-[10px] font-normal">{companyLabel(record.companyId)}</Badge>
              ) : null}
              {branchName ? (
                <Badge variant="outline" className="text-[10px] font-normal">{branchName}</Badge>
              ) : null}
              {record.managerEmployeeId ? (
                <span className="text-[10px] text-muted-foreground" dir="ltr">
                  مدير: {record.managerEmployeeId.slice(0, 8)}…
                </span>
              ) : null}
              {subDepts.length > 0 && (
                <span className="flex items-center gap-1">
                  <Network className="h-3.5 w-3.5" />
                  {subDepts.length} فرعي
                </span>
              )}
           
            </DirectoryGridCardMetaChips>

            <DirectoryGridCardFooter className="border-border/60 pt-1">
              {canUpdate ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(dept);
                  }}
                  aria-label="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(dept.id);
                  }}
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </DirectoryGridCardFooter>
          </DirectoryGridCard>
        );
      })}
    </DirectoryGrid>
  );
}
