# Frontend / Backend Boundary

**Purpose:** Map every mock, simulated, and client-side persistence layer in the Shiny Stone Sales OS frontend so the backend team knows **exactly which interfaces to implement** without changing UI components.

**Frontend freeze reference:** `docs/FRONTEND_FREEZE.md`  
**API contract reference:** `docs/API_CONTRACT.md`  
**Checkpoint commit:** `7864e5b62cbe2cbecb166cea4363c2d631df51fc`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  UI (pages + components) — FROZEN                           │
│  Reads: mostly useCRMStore()                                │
│  Writes: mix of @/services/* and direct useCRMStore()       │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│  @/services         │              │  useCRMStore()      │
│  (async mock layer) │──────────────│  crmStore.ts        │
│  interfaces.ts      │   wraps    │  + helpers.ts       │
└─────────────────────┘              └──────────┬──────────┘
                                                │
                                     ┌──────────▼──────────┐
                                     │  localStorage       │
                                     │  (storage.ts keys)  │
                                     └──────────┬──────────┘
                                                │
                                     ┌──────────▼──────────┐
                                     │  Seed mock data     │
                                     │  data/mock/*        │
                                     └─────────────────────┘
```

**Backend integration rule:** Replace implementations behind `src/services/interfaces.ts` and/or introduce API-backed store hydration. **Do not rewrite UI pages** unless fixing a critical bug.

---

## Cross-Cutting Concerns

### Mock data (seed)

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | Static seed in `src/data/mock/index.ts`, assembled into initial state by `src/data/mock/seed.ts` → `createSeedState()`. Loaded on first visit or after demo reset via `crmStore.initStore()`. |
| **REQUIRED BACKEND IMPLEMENTATION** | Database seeded via migrations; API returns live records. No client-side seed bundle in production. |
| **EXPECTED REPLACEMENT POINT** | `src/data/mock/seed.ts` (bypass in production), `crmStore.initStore()` (fetch from API instead of `loadFromStorage` / seed). |

---

### localStorage (CRM persistence)

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | `src/store/storage.ts` persists all CRM entities under namespace `shiny-stone-sales-os-*`: customers, contacts, deals, emails, POs, follow-ups, workflows, users, notifications, activities, salesTargets, settings, `currentUserId`. Written on every mutation in `crmStore.setState()` → `persist()`. |
| **REQUIRED BACKEND IMPLEMENTATION** | Server-side database (Supabase/Postgres per `supabase/schema.sql`). Auth session cookie/JWT instead of `currentUserId` in localStorage. |
| **EXPECTED REPLACEMENT POINT** | `src/store/storage.ts`, `src/store/crmStore.ts` (`persist`, `initStore`, `loadFromStorage`). Long-term: remove client persistence; use React Query/SWR + services. |

**UI-only localStorage (keep or replace with preferences API):**

| Key | File | Purpose |
|-----|------|---------|
| `shiny-stone-sidebar-collapsed` | `src/components/layout/app-shell.tsx` | Sidebar collapse preference |

---

### Simulated authentication

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | `/login` (`src/app/(auth)/login/page.tsx`) — form submit shows toast and `router.push("/dashboard")`; no credential check, no session token. Current user comes from `state.currentUserId` in localStorage (default seed user `user-1`). `getCurrentUser()` in `crmStore.ts` resolves user from in-memory `state.users`. |
| **REQUIRED BACKEND IMPLEMENTATION** | Supabase Auth (or equivalent): sign-in, sign-out, session refresh, protected routes, password reset. Map auth user → CRM user profile + role. |
| **EXPECTED REPLACEMENT POINT** | New `src/services/authService.ts` + `AuthService` interface; wire login page to auth service; replace `setCurrentUser()` simulation with session from auth provider. Scaffold exists: `src/lib/supabase/client.ts` (not wired to UI). |

---

### Simulated role permissions

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **UI gating:** `usePermissions()` in `src/store/CRMStoreProvider.tsx` (`canEdit`, `canManageUsers`, `canAccessTeamPerformance`, `isReadOnly`) derived from `getCurrentUser().role`. **Data scoping:** `filterByRole()` in `src/store/helpers.ts` applied in `crmStore` getters for customers, contacts, deals, emails, POs, follow-ups. **Role simulation:** Settings → “Simulate Role” calls `setCurrentUser(userId)` (`src/app/(app)/settings/page.tsx`). Static helpers in `src/lib/auth/permissions.ts` (partially duplicated; not used by `usePermissions`). |
| **REQUIRED BACKEND IMPLEMENTATION** | Server-enforced RLS / API authorization by role (`admin`, `sales_manager`, `salesperson`, `viewer`). JWT claims or profile lookup; never trust client-only filters. |
| **EXPECTED REPLACEMENT POINT** | Backend policies in Supabase/API; frontend keeps `usePermissions()` but reads role from auth session; remove Settings role simulation in production. Data filtering moves to API queries (store getters become API fetches). |

---

### Simulated AI

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | Deterministic keyword rules in `src/services/mock/aiService.ts`: `classifyEmail`, `summarizeEmail`, `generateReply`, `recommendFollowUp`, `extractPOFields`, `getDealInsight`. No LLM calls. Gated by `settings.aiEnabled` from store. **UI consumers:** `src/components/email/ai-assist-panel.tsx`, `src/app/(app)/follow-ups/page.tsx` (`generateReply`), `src/app/(app)/deals/[id]/page.tsx` (`getDealInsight`), `src/app/(app)/purchase-orders/[id]/page.tsx` (`extractPOFields`). |
| **REQUIRED BACKEND IMPLEMENTATION** | AI microservice or Supabase Edge Functions: email classification, summarization, draft generation, deal insights, follow-up recommendations. Return same response shapes (or extend interfaces). PO extraction may combine OCR + LLM. |
| **EXPECTED REPLACEMENT POINT** | Create `src/services/aiService.ts` interface; swap `src/services/mock/aiService.ts` → `src/services/api/aiService.ts`. UI imports should change from `@/services/mock/aiService` to `@/services` only (future refactor — not required for backend team). |

---

### Simulated email

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | Inbox threads stored in `crmStore.emails` (seed: `mockEmailThreads`). `sendEmail()` appends to store with `folder: "sent"`; no SMTP/OAuth. Read/unread, drafts, link-to-deal are in-memory. AI panel uses mock classification on stored threads. |
| **REQUIRED BACKEND IMPLEMENTATION** | Email provider integration (Gmail/Outlook API or IMAP), webhook/sync, outbound send pipeline, thread storage, read state, CRM linking (`customerId`, `dealId`). |
| **EXPECTED REPLACEMENT POINT** | `EmailService` in `src/services/interfaces.ts` → `src/services/mock/emailService.ts` replaced by API implementation; register in `src/services/index.ts` as `emailService`. Secondary: inbox UI reads via `getEmails()` on store today — migrate reads to `emailService.getEmails()`. |

---

### Simulated PO extraction

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | Upload in `src/components/purchase-orders/po-form-dialog.tsx` captures **file metadata only** (name, size, type) — no blob upload. Detail page “Extract Information” calls `extractPOFields()` from mock AI (tax math + fake line items + fixed 96% confidence). PO CRUD in `crmStore.createPurchaseOrder` / `updatePurchaseOrder`. |
| **REQUIRED BACKEND IMPLEMENTATION** | File storage bucket, OCR/document parsing, extraction API returning structured fields + confidence, human review workflow, status transitions. |
| **EXPECTED REPLACEMENT POINT** | `PurchaseOrderService` + new `POST /api/purchase-orders/:id/extract` (see `API_CONTRACT.md`); AI extraction via `AIService.extractPOFields` backend equivalent. PO create currently bypasses service in `po-form-dialog.tsx` — backend should still implement `purchaseOrderService` for parity. |

---

### Simulated automation

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | Workflows stored in `crmStore.workflows` (seed: `mockWorkflows`). `runWorkflow()` in `crmStore.ts` fakes execution: maps steps to `✓ {label}` strings, updates `lastRun`, adds activity + notification. No job queue or external triggers. |
| **REQUIRED BACKEND IMPLEMENTATION** | Workflow engine (cron/event-driven), step execution, logging, enable/disable, test-run endpoint returning real execution results. |
| **EXPECTED REPLACEMENT POINT** | `AutomationService` → `src/services/mock/automationService.ts` replaced by API; `runWorkflow(id)` → `POST /api/workflows/:id/run`. |

---

## Module-by-Module Boundary

### Customers

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read:** `useCRMStore().getCustomers()` / `getCustomer()` / `getDealsByCustomer()` on list & detail pages. **Write:** `customerService` in `customer-form-dialog.tsx`. **Store:** `crmStore.createCustomer`, `updateCustomer`, `deleteCustomer` + activities/notifications. **Enrichment:** `enrichCustomer()` computes `activeDeals`, `revenue`, `lastActivity`. |
| **REQUIRED BACKEND IMPLEMENTATION** | CRUD REST or Supabase RPC per `API_CONTRACT.md` (`GET/POST/PATCH/DELETE /api/customers`). Computed fields may be server views or returned on read. |
| **EXPECTED REPLACEMENT POINT** | `CustomerService` → `src/services/mock/customerService.ts`; export swap in `src/services/index.ts` (`customerService`). |

**UI files (reads today):** `src/app/(app)/customers/page.tsx`, `src/app/(app)/customers/[id]/page.tsx`

---

### Contacts

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read:** `getContacts()`, `getContactsByCustomer()` via store. **Write:** `contactService` in `contact-form-dialog.tsx`. **Store:** `createContact`, `updateContact`, `deleteContact`. |
| **REQUIRED BACKEND IMPLEMENTATION** | `GET/POST/PATCH/DELETE /api/contacts` linked to `companyId` (customer). |
| **EXPECTED REPLACEMENT POINT** | `ContactService` → `src/services/mock/contactService.ts`; `src/services/index.ts` (`contactService`). |

**UI files:** `src/app/(app)/contacts/page.tsx`, customer detail contacts tab

---

### Deals

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read:** `getDeals()`, `getDeal()`, related emails/follow-ups/POs/activities via store on detail page. **Write:** `dealService` in `deal-form-dialog.tsx`, `deals/page.tsx`, `deals/[id]/page.tsx` (stage change). **Store:** full deal lifecycle + `updateDealStage` side effects (activities, sales targets on won). **AI:** `getDealInsight()` mock on detail page. |
| **REQUIRED BACKEND IMPLEMENTATION** | Deal CRUD + `PATCH /api/deals/:id/stage`; relational queries for detail tabs; server-side activity logging; won-deal analytics updates. |
| **EXPECTED REPLACEMENT POINT** | `DealService` → `src/services/mock/dealService.ts`; `src/services/index.ts` (`dealService`). |

**UI files:** `src/app/(app)/deals/page.tsx`, `src/app/(app)/deals/[id]/page.tsx`

---

### Pipeline

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read/write via store only** (no `@/services` usage): `getDeals()`, `getCustomers()`, `updateDealStage()` on drag-and-drop in `src/app/(app)/pipeline/page.tsx`. |
| **REQUIRED BACKEND IMPLEMENTATION** | Same as Deals stage endpoint; pipeline is a view over deals grouped by stage. |
| **EXPECTED REPLACEMENT POINT** | `DealService.updateDealStage()` — pipeline page should call `dealService.updateDealStage()` instead of store (optional frontend refactor); backend implements stage API. |

---

### Inbox / Email

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read:** `getEmails()`, `markEmailRead()` via store in `inbox/page-content.tsx`. **Write:** `emailService.sendEmail()`, `linkEmailToDeal()` in compose/AI/inbox flows. **AI:** `ai-assist-panel.tsx` uses mock AI + `emailService.sendEmail()`. Seed threads in `mockEmailThreads`. |
| **REQUIRED BACKEND IMPLEMENTATION** | Folder sync, send, draft, read state, link to deal/customer, reply threading. See Email section above. |
| **EXPECTED REPLACEMENT POINT** | `EmailService` → `src/services/mock/emailService.ts`; migrate `markEmailRead` / `getEmails` reads from store to service. |

**UI files:** `src/app/(app)/inbox/page-content.tsx`, `src/components/email/compose-email-dialog.tsx`, `src/components/email/ai-assist-panel.tsx`

---

### Purchase Orders

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read:** `getPurchaseOrders()`, `getPOsByDeal()`, `getPOsByCustomer()` via store. **Write:** `createPurchaseOrder()` direct on store in `po-form-dialog.tsx`; `updatePurchaseOrder()` / `deletePurchaseOrder()` direct on store in `purchase-orders/[id]/page.tsx`. **Extract:** mock `extractPOFields()` on detail page. |
| **REQUIRED BACKEND IMPLEMENTATION** | PO CRUD, document upload to storage, extraction endpoint, approval/status workflow. |
| **EXPECTED REPLACEMENT POINT** | `PurchaseOrderService` → `src/services/mock/poService.ts`; wire `po-form-dialog.tsx` and PO detail page to service (today partially bypasses service). |

**UI files:** `src/app/(app)/purchase-orders/page.tsx`, `src/app/(app)/purchase-orders/[id]/page.tsx`, `src/components/purchase-orders/po-form-dialog.tsx`

---

### Follow-ups

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read:** `getFollowUps()`, `getFollowUpsByDeal()` via store. **Write:** `followUpService` for create/update/complete/reschedule/delete in `follow-ups/page.tsx` and `compose-email-dialog.tsx`. **AI:** `generateReply()` for email draft from follow-up. Status computed client-side via `computeFollowUpStatus()`. |
| **REQUIRED BACKEND IMPLEMENTATION** | Follow-up CRUD, completion, due-date rules, link to deal/customer, optional email draft generation API. |
| **EXPECTED REPLACEMENT POINT** | `FollowUpService` → `src/services/mock/followUpService.ts`; `src/services/index.ts` (`followUpService`). |

**UI files:** `src/app/(app)/follow-ups/page.tsx`, deal/customer detail tabs

---

### Automation

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read:** `getWorkflows()` via store. **Write:** `automationService` for CRUD, toggle, `runWorkflow()` in `src/app/(app)/automation/page.tsx`. Execution simulated in `crmStore.runWorkflow()`. |
| **REQUIRED BACKEND IMPLEMENTATION** | Workflow CRUD, active flag, run/test endpoint, execution audit trail. |
| **EXPECTED REPLACEMENT POINT** | `AutomationService` → `src/services/mock/automationService.ts`; `src/services/index.ts` (`automationService`). |

---

### Dashboard

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **All reads direct from store:** `getDashboardMetrics()`, `getPipeline()`, `getAttentionDealsList()`, `getActivities()`, `getTeamPerformance()`, `getRevenueChartData()` in `src/app/(app)/dashboard/page.tsx`. Mock wrapper exists but **not exported** from `src/services/index.ts` (`src/services/mock/dashboardService.ts`). Metrics calculated client-side in `calculateDashboardMetrics()`. |
| **REQUIRED BACKEND IMPLEMENTATION** | `GET /api/dashboard/metrics`, aggregated KPIs, attention deals query, activity feed pagination, team performance, revenue time-series from real data. |
| **EXPECTED REPLACEMENT POINT** | Add `DashboardService` interface + export; replace `dashboardService.ts` mock with API; dashboard page calls service instead of store (UI unchanged). |

---

### Reports

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **All reads direct from store** in `src/app/(app)/reports/page.tsx` (same getters as dashboard + client-side `dealsByStage` memo). Mock `reportService.ts` exists but **not wired** to `src/services/index.ts`. Revenue chart partially synthetic (`getRevenueChartData()` scales `totalSales`). |
| **REQUIRED BACKEND IMPLEMENTATION** | `GET /api/reports?period=6m`, server-side aggregates, historical revenue series, team filters. |
| **EXPECTED REPLACEMENT POINT** | Add `ReportService` interface; `src/services/mock/reportService.ts` → API; wire reports page to service. |

---

### Notifications

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Read/write via store** in `src/components/layout/app-header.tsx`: `getNotifications()`, `getUnreadNotificationCount()`, `markNotificationRead()`, `markAllNotificationsRead()`. Mock `notificationService.ts` exported from index but **header does not use it**. Notifications created as side effects in `crmStore` mutations. |
| **REQUIRED BACKEND IMPLEMENTATION** | User-scoped notification feed, read/unread, push or poll, created by server on domain events. |
| **EXPECTED REPLACEMENT POINT** | `NotificationService` → `src/services/mock/notificationService.ts`; wire `app-header.tsx` to `notificationService`. |

---

### Users (admin)

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Direct store** in `src/app/(app)/users/page.tsx`: `getUsers()`, `createUser()`, `updateUser()`, `deactivateUser()`. `userService` exported from index but **page bypasses it**. Users seeded in mock data. |
| **REQUIRED BACKEND IMPLEMENTATION** | Admin user management API, invite/deactivate, role assignment synced with auth provider. |
| **EXPECTED REPLACEMENT POINT** | `UserService` → `src/services/mock/userService.ts`; wire users page to `userService`. |

---

### Settings

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | **Direct store** in `src/app/(app)/settings/page.tsx`: `getSettings()`, `updateSettings()`, `resetStore()`, `exportStoreData()`, `setCurrentUser()`. Profile save is toast-only (not persisted). `settingsService.ts` mock exists but **not exported** from `src/services/index.ts`. |
| **REQUIRED BACKEND IMPLEMENTATION** | User profile API, company settings, integration config, notification preferences; demo reset/export removed in production. |
| **EXPECTED REPLACEMENT POINT** | `SettingsService` in `src/services/interfaces.ts` → implement API + export from `src/services/index.ts`; wire settings page to service. |

---

### Global search

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | `crmStore.search()` → `globalSearch()` in helpers scans in-memory entities. Used by `app-header.tsx` and `mobile-search.tsx`. |
| **REQUIRED BACKEND IMPLEMENTATION** | `GET /api/search?q=` full-text across customers, contacts, deals, POs, emails. |
| **EXPECTED REPLACEMENT POINT** | `SettingsService.search()` (interface already defined) or dedicated `SearchService`; wire header/mobile search. |

---

### Activities (audit timeline)

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | Append-only list in `crmStore.activities`, created as side effects of mutations. Read via `getActivities({ customerId, dealId })` on detail pages and dashboard. Max 100 items client-side. |
| **REQUIRED BACKEND IMPLEMENTATION** | Server-generated activity/audit log on domain events; paginated API. |
| **EXPECTED REPLACEMENT POINT** | Part of dashboard/customer/deal detail APIs or `GET /api/activities?entityId=`. No dedicated service interface today — add `ActivityService` or include in entity detail endpoints. |

---

### Sales targets

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | `state.salesTargets` in localStorage; recalculated on deal won in `crmStore.updateDealStage()`. Used by dashboard metrics and team performance. |
| **REQUIRED BACKEND IMPLEMENTATION** | Targets per user/period in DB; achievement computed server-side. |
| **EXPECTED REPLACEMENT POINT** | Reports/dashboard API responses; optional `SalesTargetService`. |

---

## Mock Services Inventory

| Service | Interface | Mock file | Exported in `index.ts` | Wired in UI |
|---------|-----------|-----------|------------------------|-------------|
| Customer | `CustomerService` | `mock/customerService.ts` | Yes | Partial (forms only) |
| Contact | `ContactService` | `mock/contactService.ts` | Yes | Partial (forms only) |
| Deal | `DealService` | `mock/dealService.ts` | Yes | Partial |
| Email | `EmailService` | `mock/emailService.ts` | Yes | Partial |
| Purchase Order | `PurchaseOrderService` | `mock/poService.ts` | Yes | Partial (PO form bypasses) |
| Follow-up | `FollowUpService` | `mock/followUpService.ts` | Yes | Yes |
| Automation | `AutomationService` | `mock/automationService.ts` | Yes | Yes |
| Notification | `NotificationService` | `mock/notificationService.ts` | Yes | No (store direct) |
| User | `UserService` | `mock/userService.ts` | Yes | No (store direct) |
| Settings | `SettingsService` | `mock/settingsService.ts` | **No** | No (store direct) |
| Dashboard | *(none)* | `mock/dashboardService.ts` | **No** | No (store direct) |
| Reports | *(none)* | `mock/reportService.ts` | **No** | No (store direct) |
| AI | *(none)* | `mock/aiService.ts` | **No** | Direct import |

All mock services follow the same pattern: `await delay()` → delegate to `crmStore.*`.

**Single swap registry for backend:** `src/services/index.ts`

---

## Backend Replacement Points (Priority Order)

1. **`src/services/index.ts`** — replace `Mock*Service` instances with API/Supabase implementations
2. **`src/services/interfaces.ts`** — extend with `AuthService`, `DashboardService`, `ReportService`, `AIService` as needed
3. **`src/store/crmStore.ts`** — remove `persist()` / localStorage; optionally thin to cache layer or remove after full service migration
4. **`src/data/mock/seed.ts`** — dev-only seeding
5. **Direct `useCRMStore()` writes** — migrate to services (pipeline, PO form, users, settings, notifications) without UI redesign
6. **Direct `@/services/mock/aiService` imports** — route through `@/services/aiService` export

---

## Supabase Scaffold (unused)

| File | Status |
|------|--------|
| `src/lib/supabase/client.ts` | Client factory; returns `null` if env vars missing |
| `src/lib/supabase/types.ts` | Generated-style DB types |
| `supabase/schema.sql` | Reference schema for backend team |
| `.env.example` | Placeholder `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

No page imports `supabase` client today.

---

### Documents & Storage (Feature 11)

| | |
|---|---|
| **CURRENT FRONTEND IMPLEMENTATION** | `src/store/documents.ts` domain; `crmStoreDocuments.ts`; mock `DocumentService` at `src/services/mock/documentService.ts`. Admin UI at `/data-management/documents`. Metadata only — mock paths like `mock://documents/{id}/v{n}/{file}`. No binary in localStorage. |
| **REQUIRED BACKEND IMPLEMENTATION** | Supabase Storage private bucket `documents`; Postgres tables `documents`, `document_versions`, `document_processing`; signed download/preview URLs; OCR/AI processing workers server-side. |
| **EXPECTED REPLACEMENT POINT** | `DocumentService` implementation in `src/services/supabase/`; API routes per `docs/API_CONTRACT.md`. UI unchanged. |
| **FUTURE STORAGE PATH** | `organizations/{organizationId}/documents/{documentId}/v{version}/{filename}` |

---

### System Health (Feature 12)

| | |
|---|---|
| **CURRENT** | `src/store/systemHealth.ts`, `crmStoreSystemHealth.ts`, mock service. Admin UI `/system-health`. Mock check only — no network probes. |
| **REQUIRED** | Backend health aggregator probing DB, Storage, Auth, Email, AI, Workers, API. |
| **API** | See `docs/API_CONTRACT.md` — System Health section |

---

### Backup & Recovery (Feature 13)

| | |
|---|---|
| **CURRENT** | `src/store/backups.ts`, `crmStoreBackups.ts`, mock service. Admin UI `/backup-recovery`. Simulate restore only — never modifies data. |
| **REQUIRED** | Backup scheduler/worker, encrypted private storage, DB + Storage snapshots, verified restore with approval. |
| **API** | See `docs/API_CONTRACT.md` — Backups section |

---

## Open Questions

1. **Migration strategy:** Big-bang swap in `services/index.ts` vs. module-by-module with `useCRMStore` reads remaining temporarily?
2. **Real-time updates:** Should backend push notifications/activity via websockets, or is polling sufficient for v1?
3. **Email provider:** Gmail, Outlook, or generic IMAP for inbox integration?
4. **PO documents:** Which storage (Supabase Storage, S3) and which OCR vendor for extraction?
5. **AI provider:** Single LLM for classify/reply/insight/extract, or separate services? Must outputs remain human-reviewable per frontend UX?
6. **Auth ↔ CRM user mapping:** One Supabase auth user per `users` row, or separate identity table?
7. **Role simulation removal:** Confirm Settings “Simulate Role” is dev-only and removed/hidden in production.
8. **Computed fields:** Should `enrichCustomer` / `enrichDeal` logic move to SQL views, API DTOs, or stay client-side after fetch?
9. **Activities cap:** Backend pagination vs. current 100-item client slice?
10. **Revenue chart:** Reports page uses partially synthetic chart data — confirm expected historical data source and granularity.

---

## What Backend Should NOT Change

- `src/app/globals.css`, Tailwind/PostCSS config, design tokens
- `src/components/layout/app-shell.tsx`, `app-sidebar.tsx` structure
- Page layouts and shadcn component usage
- Visual UX flows (compose, PO review, pipeline drag-and-drop)

Backend work stays **below** `src/services/interfaces.ts` and auth/session layer.
