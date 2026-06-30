/** Permission codes for a single page — defined in that feature's `permissions.ts`. */
export type PagePermissionDefs = {
  read: string;
  create?: string;
  update?: string;
  delete?: string;
  approve?: string;
  export?: string;
};

export type PagePermissions = {
  codes: PagePermissionDefs;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
};
