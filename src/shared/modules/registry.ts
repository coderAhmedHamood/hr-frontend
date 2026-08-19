/**
 * Platform module registry.
 *
 * Every top-level application (HR, System, Ecommerce, future CRM/Inventory, ...) is registered
 * here. `installable` modules can be enabled/disabled per company; `core` modules (auth, system)
 * are always present and never appear in an install/uninstall UI.
 *
 * This does NOT hot-load code — Next.js ships one build containing every module. "Enabling" a
 * module only controls whether its nav/routes/permissions are exposed to a given company.
 */

export type ModuleId = 'auth' | 'system' | 'hr' | 'ecommerce' | 'inventory' | 'contacts';

export type ModuleDefinition = {
  id: ModuleId;
  labelAr: string;
  /** Core modules are always enabled and are never shown in an install/uninstall UI. */
  installable: boolean;
  /** Codes that count as this module in `enabledApplicationCodes`. */
  applicationCodes: string[];
};

export const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition> = {
  auth: { id: 'auth', labelAr: 'الدخول', installable: false, applicationCodes: [] },
  system: { id: 'system', labelAr: 'النظام', installable: false, applicationCodes: ['system'] },
  hr: { id: 'hr', labelAr: 'الموارد البشرية', installable: true, applicationCodes: ['hr'] },
  ecommerce: {
    id: 'ecommerce',
    labelAr: 'إدارة المتجر',
    installable: true,
    applicationCodes: ['ecommerce', 'store-admin', 'storeadmin'],
  },
  inventory: { id: 'inventory', labelAr: 'المخزون', installable: true, applicationCodes: ['inventory'] },
  contacts: {
    id: 'contacts',
    labelAr: 'جهات الاتصال',
    installable: true,
    applicationCodes: ['contacts', 'partners'],
  },
};

export type ModuleEnablementContext = {
  isSystemOwner?: boolean;
  /** When omitted/empty, installable modules stay visible (pre-migration sessions). */
  enabledApplicationCodes?: string[] | null;
};

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

/**
 * True when `moduleId` should be visible/usable for a company.
 * Pass `enabledApplicationCodes` from the access profile company.
 * System Owner is not restricted by company enablement.
 */
export function isModuleEnabledFor(
  moduleId: ModuleId,
  companyId: string | null | undefined,
  context?: ModuleEnablementContext,
): boolean {
  const definition = MODULE_REGISTRY[moduleId];
  if (!definition.installable) return true;
  if (context?.isSystemOwner) return true;
  if (!companyId) return false;
  const codes = context?.enabledApplicationCodes;
  if (!codes || codes.length === 0) return true;
  const enabled = new Set(codes.map(normalizeCode));
  return definition.applicationCodes.some((code) => {
    const wanted = normalizeCode(code);
    if (enabled.has(wanted)) return true;
    if (wanted === 'ecommerce' || wanted === 'store-admin' || wanted === 'storeadmin') {
      return enabled.has('ecommerce') || enabled.has('store-admin') || enabled.has('storeadmin');
    }
    if (wanted === 'contacts' || wanted === 'partners') {
      return enabled.has('contacts') || enabled.has('partners');
    }
    return false;
  });
}
