/**
 * Platform module registry.
 *
 * Every top-level application (HR, System, Ecommerce, future CRM/Inventory, ...) is registered
 * here. `installable` modules can be enabled/disabled per company; `core` modules (auth, system)
 * are always present and never appear in an install/uninstall UI.
 *
 * This does NOT hot-load code — Next.js ships one build containing every module. "Enabling" a
 * module only controls whether its nav/routes/permissions are exposed to a given company. When
 * the backend exposes real per-company enabled-module state, `isModuleEnabledFor` swaps its
 * implementation without any caller changes.
 */

export type ModuleId = 'auth' | 'system' | 'hr' | 'ecommerce' | 'inventory';

export type ModuleDefinition = {
  id: ModuleId;
  labelAr: string;
  /** Core modules are always enabled and are never shown in an install/uninstall UI. */
  installable: boolean;
};

export const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition> = {
  auth: { id: 'auth', labelAr: 'الدخول', installable: false },
  system: { id: 'system', labelAr: 'النظام', installable: false },
  hr: { id: 'hr', labelAr: 'الموارد البشرية', installable: true },
  ecommerce: { id: 'ecommerce', labelAr: 'المتجر الإلكتروني', installable: true },
  inventory: { id: 'inventory', labelAr: 'المخزون', installable: true },
};

/**
 * True when `moduleId` should be visible/usable for `companyId`.
 * Stubbed to "always enabled" until the backend exposes per-company installed-module state.
 */
export function isModuleEnabledFor(moduleId: ModuleId, companyId: string | null | undefined): boolean {
  const module = MODULE_REGISTRY[moduleId];
  if (!module.installable) return true;
  if (!companyId) return false;
  return true;
}
