# Backend Integration Plan — Shiny Stone Sales OS

**Status:** Phase 1 in progress  
**Frontend freeze:** `docs/FRONTEND_FREEZE.md`  
**Boundary map:** `docs/FRONTEND_BACKEND_BOUNDARY.md`

---

## 1. Current Architecture

```
UI (FROZEN — pages/components)
  ↓ reads: useCRMStore() [legacy, being phased out per module]
  ↓ writes: @/services/* [target]
Service interfaces (src/services/interfaces.ts)
  ↓
Mock implementations (default) → crmStore + localStorage
Production stubs → Supabase/API (phased rollout)
```

**Service mode:** `NEXT_PUBLIC_USE_MOCK_SERVICES` (default mock). Production when `false` + Supabase env configured.

---

## 2. Existing Mock Services

| Service | Mock path | Exported |
|---------|-----------|----------|
| Customer | `mock/customerService.ts` | Yes |
| Contact | `mock/contactService.ts` | Yes |
| Deal | `mock/dealService.ts` | Yes |
| Email | `mock/emailService.ts` | Yes |
| Purchase Order | `mock/poService.ts` | Yes |
| Follow-up | `mock/followUpService.ts` | Yes |
| Automation | `mock/automationService.ts` | Yes |
| Notification | `mock/notificationService.ts` | Yes |
| User | `mock/userService.ts` | Yes |
| Settings | `mock/settingsService.ts` | Yes (Phase 1) |
| Dashboard | `mock/dashboardService.ts` | Yes (Phase 1) |
| Report | `mock/reportService.ts` | Yes (Phase 1) |
| Activity | `mock/activityService.ts` | Yes (Phase 1) |
| Auth | `mock/authService.ts` | Yes (Phase 1) |
| AI | `mock/aiService.ts` + adapter | Yes (Phase 1) |
| Document | `mock/documentService.ts` | Yes (Feature 11) |
| System Health | `mock/systemHealthService.ts` | Yes (Feature 12) |
| Backup | `mock/backupService.ts` | Yes (Feature 13) |

---

## 3. Existing Supabase Schema

`supabase/schema.sql` defines partial schema:

- `users`, `customers`, `contacts`, `deals`, `purchase_orders`, `follow_ups`, `activities`
- Enums: `user_role`, `deal_stage`, `entity_status`, `po_status`
- RLS enabled; policies are placeholders only

**Missing vs frontend model:** emails, email_threads, notifications, workflows, automation_steps, automation_executions, sales_targets, PO items, storage, OAuth tokens.

---

## 4. Missing Backend Pieces

| Area | Status |
|------|--------|
| Supabase Auth + protected routes | NOT IMPLEMENTED |
| RLS policies | PLACEHOLDER ONLY |
| Email OAuth + sync | NOT IMPLEMENTED |
| AI server endpoints | NOT IMPLEMENTED |
| PO document storage | NOT IMPLEMENTED — frontend contract ready (`DocumentService`, `/data-management/documents`) |
| Automation execution engine | NOT IMPLEMENTED |
| Production service implementations | STUBS ONLY (Phase 1) |
| Next.js API routes | NOT IMPLEMENTED |
| UI → service migration (reads from store) | PARTIAL |

---

## 5. Documentation Inconsistencies

**Referenced in master prompt but NOT present in repo:**

- `docs/DATA_MODEL.md`
- `docs/AI_REQUIREMENTS.md`
- `docs/EMAIL_INTEGRATION.md`
- `docs/PO_REQUIREMENTS.md`
- `docs/RESPONSIVE_QA.md`
- `docs/FUNCTIONAL_QA.md`
- `docs/SECURITY_HANDOFF.md`

**Code vs schema conflicts (resolve in Phase 2):**

| Topic | Frontend | `supabase/schema.sql` |
|-------|----------|----------------------|
| ID format | String prefixes (`cust-`, `deal-`) via `generateId()` | UUID |
| Role enum | `salesperson` | `salesperson` (matches) |
| Customer fields | `owner`, computed `activeDeals`, `revenue` | `owner_id`, DB `revenue` column |
| Activity | `actorId`, `timestamp`, `customerId`, `dealId` | Missing several columns |
| Follow-up | `priority`, `description`, computed status | Partial |

**Prefer `src/types/index.ts` and `src/services/interfaces.ts` as implementation truth.** Documentation will be created/updated per phase.

---

## 6. Dependency Risks

- No `@supabase/ssr` or auth helpers wired yet — required for Phase 3
- Supabase client returns `null` when env missing — safe fallback to mock
- UI still reads `useCRMStore()` on most pages — backend must not break store until reads migrate
- Running `npm run build` while dev server active corrupts CSS cache (see `docs/STABILITY.md`)

---

## 7. Recommended Implementation Order

1. **Phase 1** — Service boundary + interfaces + mock/production registry ✅
2. **Phase 2** — Complete Supabase schema + `docs/SUPABASE_IMPLEMENTATION.md`
3. **Phase 3** — Auth (Supabase Auth, protected routes)
4. **Phase 4** — Users + roles + RLS foundation
5. **Phase 5** — Customers + Contacts (first production services)
6. **Phase 6** — Deals + Pipeline
7. **Phase 7** — Activity / audit trail
8. **Phase 8** — Email backend
9. **Phase 9** — AI backend
10. **Phase 10** — PO + storage
11. **Phase 11** — Follow-ups
12. **Phase 12** — Automation engine
13. **Phase 13** — Dashboard + Reports
14. **Phase 14** — Notifications
15. **Phase 15** — Global search
16. **Phase 16** — Security + RLS audit
17. **Phases 17–30** — Error handling, validation, QA, deployment, final handoff

---

## Phase 1 Deliverables

- [x] Extended `src/services/interfaces.ts` (Dashboard, Report, Activity, Auth, AI)
- [x] `src/services/config.ts` — mock vs production mode
- [x] `src/services/supabase/stubServices.ts` — production placeholders
- [x] `src/services/index.ts` — unified registry + exports
- [x] Mock adapters for auth, AI, activity, settings, dashboard, report
- [ ] UI migration to services (deferred — no UI changes in Phase 1)
- [x] `npm run build` passes
- [x] Git checkpoint: `backend-service-boundary`
