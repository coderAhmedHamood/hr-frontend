/**
 * Frontend routes for the standalone Contacts (Partners) app.
 *
 * Entry is `/contacts/list` (not bare `/contacts`) so browsers that still cache an old
 * permanent redirect from `/contacts` → System users do not get stuck.
 * Backend `routePath` may still be `/contacts`; the launcher remaps it.
 */
export const contactsAdminRoutes = {
  overview: '/contacts/list',
  partners: '/contacts/list',
  partnerNew: '/contacts/new',
  partnerDetail: (id: string) => `/contacts/${id}`,
  categories: '/contacts/categories',
} as const;
