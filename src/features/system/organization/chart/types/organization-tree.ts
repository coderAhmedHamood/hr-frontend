export interface OrganizationTreeNode {
  id: string;
  name: string;
  type: 'company' | 'branch' | 'department' | 'employee';
  meta?: string;
  avatar?: string;
  color?: string;
  children?: OrganizationTreeNode[];
}
