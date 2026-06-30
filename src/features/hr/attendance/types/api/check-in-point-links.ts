export type CheckInPointLinkResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  checkInPointId: string;
  batchId: string | null;
  effectiveFrom: string | null;
  linkActive: boolean;
};

export type CreateCheckInPointLinkDto = {
  companyId: string;
  employeeId: string;
  checkInPointId: string;
  batchId?: string | null;
  effectiveFrom?: string | null;
  linkActive?: boolean;
};

export type BulkCheckInPointLinkItem = {
  employeeId: string;
  checkInPointId: string;
};

export type BulkCreateCheckInPointLinkDto = {
  companyId: string;
  links: BulkCheckInPointLinkItem[];
  batchId?: string | null;
  effectiveFrom?: string | null;
  linkActive?: boolean;
};

export type BulkCreateCheckInPointLinkResponseDto = {
  created: number;
  requested: number;
  items: CheckInPointLinkResponseDto[];
};

export type UpdateCheckInPointLinkDto = Omit<
  Partial<CreateCheckInPointLinkDto>,
  'companyId' | 'employeeId' | 'checkInPointId'
>;

export type CheckInPointLinkListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  checkInPointId?: string;
  linkActive?: boolean;
};

export type GroupedByPointEmployee = {
  linkId: string;
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string | null;
  employeeCode: string;
  batchId: string | null;
  effectiveFrom: string | null;
  linkActive: boolean;
};

export type GroupedByPointItem = {
  checkInPoint: {
    id: string;
    companyId: string;
    nameAr: string;
    nameEn: string | null;
    latitude: string;
    longitude: string;
    radiusMeters: number;
    isActive: boolean;
  };
  totalLinks: number;
  activeLinks: number;
  employees: GroupedByPointEmployee[];
};

export type GroupedByPointQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  checkInPointId?: string;
  linkActive?: boolean;
};
