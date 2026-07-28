export const contactsAdminRoutes = {
  overview: '/contacts',
  partners: '/contacts',
  partnerNew: '/contacts/new',
  partnerDetail: (id: string) => `/contacts/${id}`,
  categories: '/contacts/categories',
} as const;
