/** Standalone Products (catalog) app — separate from المخازن and إدارة المتجر. */
export const catalogAdminRoutes = {
  products: '/catalog/products',
  productDetail: (id: string) => `/catalog/products/${id}`,
  categories: '/catalog/categories',
  attributes: '/catalog/attributes',
  brands: '/catalog/brands',
  uoms: '/catalog/uoms',
} as const;
