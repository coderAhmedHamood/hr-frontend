/**
 * Putaway rules are kept (screen, API, data) but nothing applies them yet:
 * a receipt still goes to the location the user picks. They belong to
 * receiving from purchase orders (phase 2), so every entry point is hidden
 * until then — set to true to show them again. No data is deleted.
 */
export const PUTAWAY_RULES_ENABLED = false;
