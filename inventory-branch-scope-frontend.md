# Inventory Branch Scope — Frontend Coordination Guide

> Backend enforces **branch visibility** on warehouse-scoped inventory APIs.  
> Permissions (`inv.warehouse.*`) still answer **what** the user can do.  
> Branch assignment answers **where** they can see/act.

**Status:** implemented on backend  
**Related docs:** `docs/نظام-المخازن-والصلاحيات.md`

---

## 1. Mental model (do not invent parallel ACL)

| Layer | Meaning | Source of truth |
|-------|---------|-----------------|
| **Permissions** | CRUD actions (read/create/update/delete) | Role → `inv.warehouse.*` / `inv.catalog.*` |
| **Branch scope** | Which branches’ warehouses are visible | `user_branches` **or** inventory role `isAllBranches: true` |
| **Warehouse** | Operational unit with optional `branchId` | `inventory_warehouses.branch_id` |

**Assignment UX for admins (simple):**

1. Assign user to company (`user_companies`)
2. Assign user to one or more branches (`user_branches`)
3. Assign inventory role with the needed `inv.*` permissions
4. For company-wide inventory managers: set role **`isAllBranches: true`** (Roles API)

You do **not** assign warehouses, locations, or operations one-by-one.

---

## 2. Breaking / required API changes

### 2.1 `companyId` is required on warehouse-scoped **list** endpoints

Always send `?companyId=<uuid>`:

| Endpoint | Change |
|----------|--------|
| `GET /inventory/warehouses` | `companyId` **required** |
| `GET /inventory/warehouse-locations` | `companyId` **required** |
| `GET /inventory/warehouse-operations` | `companyId` **required** |
| `GET /inventory/warehouse-operation-lines` | `companyId` **required** |
| `GET /inventory/ledger-entries` | `companyId` **required** |
| `GET /inventory/putaway-rules` | `companyId` **required** |
| `GET /inventory/stock` | already required |

Missing `companyId` → **400 Bad Request**.

### 2.2 Server filters by branch — do not trust client alone

- Optional `?branchId=` remains a **UI filter inside** the allowed set.
- If the user is not assigned to that branch (and has no all-branches role) → **403**.
- Listing without `branchId` returns **only warehouses in the user’s scope**.
- Opening another branch’s warehouse by id → **403** (not 404 by design when permission exists but scope fails).

### 2.3 Central warehouses (`branchId: null`)

- Visible / creatable **only** if the user has an inventory role with `isAllBranches: true`.
- Branch-limited users never see central warehouses.

---

## 3. How to know the user’s branch scope (Access Profile)

Use the existing access profile (login / refresh profile):

```http
GET /auth/...  (or your existing access-profile endpoint)
```

Relevant fields:

```ts
companies[].branches[].branchId   // assigned branches
companies[].roles[].isAllBranches // NEW — true ⇒ all warehouses in that company for inventory
companies[].roles[].code
```

**Frontend helper (recommended):**

```ts
function resolveInventoryBranchScope(company) {
  const hasAll = company.roles.some((r) => r.isAllBranches === true);
  if (hasAll) {
    return { hasAllBranchAccess: true, allowedBranchIds: [] as string[] };
  }
  return {
    hasAllBranchAccess: false,
    allowedBranchIds: company.branches.map((b) => b.branchId),
  };
}
```

Use this to:

- Hide branch switcher options outside `allowedBranchIds`
- Hide “central warehouse” create option unless `hasAllBranchAccess`
- Pre-select `defaultBranchId` when listing warehouses

> Still always call APIs with `companyId`. Scope is **re-enforced on the server**.

---

## 4. Roles API — new field

```http
POST /roles
PATCH /roles/:id
```

```json
{
  "applicationId": "<inventory-app-uuid>",
  "companyId": "<company-uuid>",
  "code": "inventory_manager",
  "nameAr": "مدير المخازن",
  "nameEn": "Inventory manager",
  "isAllBranches": true
}
```

Response includes `isAllBranches: boolean` (default `false`).

Only meaningful for **inventory** application roles regarding warehouse visibility (backend checks inventory app code when resolving scope).

---

## 5. Endpoint behavior matrix

| Action | Permission (What) | Branch scope (Where) |
|--------|-------------------|----------------------|
| List/get warehouses | `inv.warehouse.warehouses.read` | Filtered / asserted |
| Create warehouse with `branchId` | `...create` | Must own that branch (or all-branches) |
| Create warehouse with `branchId: null` | `...create` | **Requires** all-branches |
| Locations / operations / lines / ledger / putaway | matching `inv.warehouse.*` | Via warehouse.branch |
| Create transfer with destination | `operations.create` | **Source and destination** branches both in scope |
| `GET /inventory/stock` | `inv.catalog.products.read` | On-hand filtered by scope |
| `POST /inventory/stock/sale-deduct` | `inv.warehouse.ledger.create` | Deduct location’s warehouse must be in scope |

Catalog products/brands/categories are still **company-level** (not branch-scoped in this release).

---

## 6. Suggested UI flows

### 6.1 Warehouse list screen

1. Require active `companyId` in app context.
2. Call `GET /inventory/warehouses?companyId=...` (optional `&branchId=` from branch tabs).
3. Do not client-merge warehouses from other companies/branches.

### 6.2 Admin: grant branch inventory access

1. User → Companies → Branches (existing org assignment screens).
2. User → Roles → attach inventory role with CRUD permissions needed.
3. Toggle **All branches** on that inventory role only for managers.

### 6.3 POS / stock

1. Bind POS to a branch (and ideally a default warehouse/location of that branch).
2. `GET /inventory/stock?companyId=...&warehouseId=...` or `locationId=...`.
3. Expect 403 if warehouse is outside the cashier’s branches.

### 6.4 Transfers between branches

- User must have access to **both** source and destination warehouse branches to create the operation with `destinationWarehouseId`.
- There is still **one** permission set for operations (no separate “close transfer” permission in this release).
- Note: setting status to `done` does not by itself post ledger; stock truth remains ledger / sale-stock paths (also scoped).

---

## 7. Error codes to handle

| HTTP | Typical cause | UI hint |
|------|---------------|---------|
| 400 | Missing `companyId` on list | Fix request; show company picker |
| 403 | Permission missing **or** outside branch scope | “لا تملك صلاحية على هذا الفرع” |
| 404 | Row truly missing / archived | Standard not found |

Do not treat empty lists as errors: user with no `user_branches` and no `isAllBranches` correctly sees **zero** warehouses.

---

## 8. Migration / rollout checklist (FE + BE)

- [ ] Run DB migration `1783373644666-roles-is-all-branches`
- [ ] Update Role forms to show `isAllBranches`
- [ ] Update Access Profile typing to include `roles[].isAllBranches`
- [ ] Pass `companyId` on all warehouse-scoped list calls
- [ ] Ensure demo/admin users who previously saw all warehouses either:
  - get `isAllBranches` on their inventory role, **or**
  - get explicit `user_branches` for every branch they need
- [ ] QA: user on Branch A cannot open Branch B warehouse by UUID

---

## 9. Out of scope (this release)

- Changing `PermissionsGuard` / DENY overlay semantics (DENY remains global)
- Per-warehouse or per-location user ACL tables
- Separate permission for “close transfer at destination”
- Branch scope on catalog master data (products/categories/brands)

---

## 10. Quick test script for FE

1. User U1: `user_branches = [Riyadh]`, inventory role `isAllBranches = false`, permissions read warehouses.  
   → Lists only Riyadh warehouses.
2. Same user tries Jeddah warehouse id → 403.
3. Set role `isAllBranches = true` → sees all + central (`branchId` null).
4. User with no branches and no all-branches → empty list.
5. Create transfer Riyadh→Jeddah with only Riyadh access → 403 on destination.
