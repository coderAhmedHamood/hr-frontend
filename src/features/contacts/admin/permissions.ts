import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes from `contacts-api.md` (`cnt.*`). */
export const PARTNERS_PAGE_PERMISSIONS = {
  read: 'cnt.partners.read',
  create: 'cnt.partners.create',
  update: 'cnt.partners.update',
  delete: 'cnt.partners.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_CATEGORIES_PAGE_PERMISSIONS = {
  read: 'cnt.partner-categories.read',
  create: 'cnt.partner-categories.create',
  update: 'cnt.partner-categories.update',
  delete: 'cnt.partner-categories.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_ADDRESSES_PERMISSIONS = {
  read: 'cnt.partner-addresses.read',
  create: 'cnt.partner-addresses.create',
  update: 'cnt.partner-addresses.update',
  delete: 'cnt.partner-addresses.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_CHANNELS_PERMISSIONS = {
  read: 'cnt.partner-channels.read',
  create: 'cnt.partner-channels.create',
  update: 'cnt.partner-channels.update',
  delete: 'cnt.partner-channels.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_ACTIVITIES_PERMISSIONS = {
  read: 'cnt.partner-activities.read',
  create: 'cnt.partner-activities.create',
  update: 'cnt.partner-activities.update',
  delete: 'cnt.partner-activities.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_NOTES_PERMISSIONS = {
  read: 'cnt.partner-notes.read',
  create: 'cnt.partner-notes.create',
  update: 'cnt.partner-notes.update',
  delete: 'cnt.partner-notes.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_ATTACHMENTS_PERMISSIONS = {
  read: 'cnt.partner-attachments.read',
  create: 'cnt.partner-attachments.create',
  update: 'cnt.partner-attachments.update',
  delete: 'cnt.partner-attachments.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_RELATIONS_PERMISSIONS = {
  read: 'cnt.partner-relations.read',
  create: 'cnt.partner-relations.create',
  update: 'cnt.partner-relations.update',
  delete: 'cnt.partner-relations.delete',
} as const satisfies PagePermissionDefs;

export const PARTNER_CATEGORY_MEMBERS_PERMISSIONS = {
  read: 'cnt.partner-category-members.read',
  create: 'cnt.partner-category-members.create',
  delete: 'cnt.partner-category-members.delete',
} as const;
