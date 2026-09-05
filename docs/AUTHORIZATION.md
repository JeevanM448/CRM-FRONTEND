# Authorization

**Status:** NOT IMPLEMENTED (production); UI simulation only

---

## Roles

| Role | Code value | Intended access |
|------|------------|-----------------|
| Admin | `admin` | Full |
| Sales Manager | `sales_manager` | Team + reports |
| Salesperson | `salesperson` | Own records |
| Viewer | `viewer` | Read-only |

---

## Frontend (NOT security)

- `usePermissions()` in `CRMStoreProvider.tsx`
- `filterByRole()` in `store/helpers.ts` — filters lists client-side
- Settings role simulation — dev/demo only

**These must not be relied on for production authorization.**

---

## Backend requirements (RLS)

| Table | Policy direction |
|-------|------------------|
| customers, contacts, deals | Owner/team visibility by role |
| emails, POs, follow-ups | Same as parent customer/deal |
| activities | Read by entity access; insert by server |
| users | Admin manage; self read profile |
| notifications | `user_id = auth.uid()` |

---

## Ownership model

- Records have `ownerId` / `owner_id`
- Salesperson sees own + unassigned (define in policy)
- Manager sees team (requires team mapping — **not in schema yet**)

---

## BLOCKED

RLS policies not written. See Phase 4 and Phase 16 of integration plan.
