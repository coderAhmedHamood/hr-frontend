/** Partner portal account kinds (Public - Partner Auth). */
export type PartnerAccountKind = 'customer' | 'vendor' | 'visitor';

export type PartnerAuthUser = {
  id: string;
  email: string;
  phone: string;
  fullNameAr: string;
  userType: string;
};

export type PartnerAuthPartner = {
  id: string;
  name: string;
  displayName: string;
  isCustomer: boolean;
  isVendor: boolean;
  email: string;
  mobile: string;
};

/** Shared success payload from register / login. */
export type PartnerAuthSessionPayload = {
  access_token: string;
  userId: string;
  partnerId: string;
  companyId: string;
  user: PartnerAuthUser;
  partner: PartnerAuthPartner;
  message?: string;
};

export type PartnerRegisterInput = {
  companyId: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  accountKind: PartnerAccountKind;
  branchId?: string;
};

export type PartnerLoginInput = {
  identifier: string;
  password: string;
  companyId?: string;
};

export type PartnerMePayload = {
  user: PartnerAuthUser;
  partner: PartnerAuthPartner;
  companyId: string;
  userId: string;
  partnerId: string;
};

export class PartnerAuthApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = 'PartnerAuthApiError';
    this.status = status;
    this.code = code;
  }
}
