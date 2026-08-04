/** Cookie used to persist the resolved locale for non-storefront (admin) requests. */
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

/** Message namespaces merged for every request. One file per namespace per locale under `messages/<locale>/`. */
export const MESSAGE_NAMESPACES = ['common', 'storefront', 'ecommerceAdmin'] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];
