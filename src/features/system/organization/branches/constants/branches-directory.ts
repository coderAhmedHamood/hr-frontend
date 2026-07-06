import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';

export type BranchRow = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  nameEn: string | null;
  city: string;
  district: string | null;
  address: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  latitude: string | null;
  longitude: string | null;
  manager: string;
  isHeadquarters: boolean;
  isActive: boolean;
  notes: string | null;
};

export type BranchDraftForm = {
  companyId: string;
  name: string;
  nameEn: string;
  city: string;
  managerEmployeeId: string;
  managerName: string;
  isHeadquarters: boolean;
  isActive: boolean;
};

export const BRANCH_EMPTY_FORM: BranchDraftForm = {
  companyId: '',
  name: '',
  nameEn: '',
  city: '',
  managerEmployeeId: '',
  managerName: '',
  isHeadquarters: false,
  isActive: true,
};

export function mapBranchResponse(branch: BranchResponseDto): BranchRow {
  return {
    id: branch.id,
    companyId: branch.companyId,
    code: branch.code,
    name: branch.nameAr,
    nameEn: branch.nameEn,
    city: branch.city ?? '',
    district: branch.district,
    address: branch.address,
    postalCode: branch.postalCode,
    email: branch.email,
    phone: branch.phone,
    mobile: branch.mobile,
    latitude: branch.latitude,
    longitude: branch.longitude,
    manager: branch.managerName ?? '',
    isHeadquarters: branch.isHeadquarters,
    isActive: branch.isActive,
    notes: branch.notes,
  };
}

export function branchRowToDraftForm(
  branch: BranchRow,
  employees?: { id: string; nameAr: string }[],
): BranchDraftForm {
  const matched = employees?.find(
    (e) => e.nameAr.trim() === branch.manager.trim(),
  );
  return {
    companyId: branch.companyId,
    name: branch.name,
    nameEn: branch.nameEn ?? '',
    city: branch.city,
    managerEmployeeId: matched?.id ?? '',
    managerName: branch.manager,
    isHeadquarters: branch.isHeadquarters,
    isActive: branch.isActive,
  };
}

export function draftFormToCreatePayload(form: BranchDraftForm, companyId: string, code: string) {
  return {
    companyId,
    code,
    nameAr: form.name.trim(),
    city: form.city.trim() || null,
    managerName: form.managerName.trim() || null,
    isHeadquarters: form.isHeadquarters,
    isActive: form.isActive,
  };
}

export function draftFormToUpdatePayload(form: BranchDraftForm) {
  return {
    nameAr: form.name.trim(),
    city: form.city.trim() || null,
    managerName: form.managerName.trim() || null,
    isHeadquarters: form.isHeadquarters,
    isActive: form.isActive,
  };
}
