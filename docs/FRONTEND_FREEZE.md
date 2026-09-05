# Frontend Freeze — Shiny Stone Sales OS

**Status:** Frontend MVP is **FROZEN** and ready for backend integration.  
**Checkpoint commit:** `7864e5b62cbe2cbecb166cea4363c2d631df51fc`  
**Commit message:** `Frontend MVP stable before backend integration`  
**Date:** 2026-09-01

---

## Frontend MVP Status

The frontend MVP is **complete, build-stable, and visually verified** across all primary routes. The UI, design system, application shell, sidebar, and component structure must **not** be redesigned or restructured during backend work.

| Check | Result |
|-------|--------|
| `npm run build` | PASS (19 routes) |
| Tailwind / shadcn styling | PASS (CSS 200 on all routes) |
| Responsive layout markers | PASS |
| Mock CRUD + relational store | PASS |
| Service layer abstraction | READY for swap |

---

## Features Completed

1. **Authentication UI** — `/login` (mock submit → dashboard)
2. **Dashboard** — KPI cards, charts, activity feed, attention deals
3. **Customers** — list, detail tabs, create/edit, linked deals/POs/emails
4. **Contacts** — list, create/edit, linked to customers
5. **Deals** — list, detail, stage changes, emails/follow-ups/POs on deal
6. **Pipeline** — kanban by stage, drag-to-update stage
7. **Inbox** — folders, read/unread, compose, reply, link to deal/customer
8. **Purchase Orders** — list, detail, upload metadata, AI extract review, approve flow
9. **Follow-ups** — list, create/edit/complete, generate email draft
10. **Automation** — workflow CRUD, toggle, test run
11. **Reports** — KPIs, pipeline, revenue chart, team performance
12. **Users** — admin user management (mock)
13. **Settings** — profile, company, AI toggles, role simulation, demo reset

**Cross-cutting:**

- Global search (header)
- Notifications panel
- Role-based permissions (`admin`, `sales_manager`, `salesperson`, `viewer`)
- Responsive app shell (desktop sidebar + mobile header/search)
- Shared form dialogs, confirm dialogs, toasts, empty/loading states

---

## Mock Functionality Currently Used

### Central store

- **`src/store/crmStore.ts`** — single source of truth for all entities
- **`src/store/CRMStoreProvider.tsx`** — React Context + `useSyncExternalStore`
- **`src/store/storage.ts`** — `localStorage` persistence (`shiny-stone-sales-os-*` keys)
- **`src/store/helpers.ts`** — enrichment, dashboard metrics, search, validation types
- **`src/data/mock/seed.ts`** — initial seed data

### Service layer (swap point for backend)

All UI writes should go through **`@/services`** exports:

| Service | Mock impl | Store backing |
|---------|-----------|---------------|
| `customerService` | `src/services/mock/customerService.ts` | `crmStore` |
| `contactService` | `src/services/mock/contactService.ts` | `crmStore` |
| `dealService` | `src/services/mock/dealService.ts` | `crmStore` |
| `emailService` | `src/services/mock/emailService.ts` | `crmStore` |
| `purchaseOrderService` | `src/services/mock/poService.ts` | `crmStore` |
| `followUpService` | `src/services/mock/followUpService.ts` | `crmStore` |
| `automationService` | `src/services/mock/automationService.ts` | `crmStore` |
| `notificationService` | `src/services/mock/notificationService.ts` | `crmStore` |
| `userService` | `src/services/mock/userService.ts` | `crmStore` |

Contracts: **`src/services/interfaces.ts`**

AI helpers (deterministic mock): **`src/services/mock/aiService.ts`**

### Relational side effects (in-memory)

- Customer create → CRM list + activity
- Deal create → customer detail + pipeline
- Stage change → activity + dashboard metrics
- Email send/link → deal/customer history
- Follow-up create → follow-ups list + deal tab
- PO create/approve → deal tab + notifications
- Deal won → dashboard/reports + sales target recalc

---

## Known Limitations

- **No real authentication** — login is cosmetic; role is simulated via Settings
- **No real email** — inbox is seeded/simulated; no OAuth or SMTP
- **No real file upload** — PO documents store metadata only (no blob storage)
- **AI is mocked** — deterministic strings, not LLM calls
- **Data is browser-local** — `localStorage`; cleared on demo reset
- **No multi-user sync** — single-browser session only
- **Reports revenue chart** — partially derived from aggregate metrics, not historical API data
- **Supabase client** — scaffold present (`src/lib/supabase/`) but not wired to UI

---

## Features Intentionally Postponed

- Real Supabase Auth + session management
- Live email integration (Gmail/Outlook)
- PO OCR / document storage pipeline
- Production LLM integration for AI assist
- Real-time notifications / websockets
- Server-side validation and RLS policies
- Audit logging and data export
- Advanced automation execution engine
- Mobile native app / offline mode
- Internationalization (i18n)

---

## Backend Integration Starting Point

### Do

1. Implement API routes per **`docs/API_CONTRACT.md`**
2. Replace mock service classes in **`src/services/index.ts`** with API/Supabase implementations matching **`src/services/interfaces.ts`**
3. Keep **`useCRMStore()`** reads working during migration, or gradually replace with React Query + API — **without changing UI components**
4. Use **`supabase/schema.sql`** as schema reference
5. Follow **`docs/BACKEND_HANDOFF.md`** for entity relationships and permissions

### Do not

- Modify **`src/app/globals.css`**, Tailwind/PostCSS config, or design tokens
- Restructure **`app-shell`**, **`app-sidebar`**, or root layouts
- Add new UI modules or redesign existing screens during backend phase
- Bypass the service layer from page components

### Suggested swap order

1. Auth + current user
2. Customers / Contacts / Deals (core CRM)
3. Emails + Follow-ups
4. Purchase Orders
5. Dashboard metrics + Reports (server aggregates)
6. Automation + Users + Notifications

---

## Git Checkpoint

```
commit 7864e5b62cbe2cbecb166cea4363c2d631df51fc
Frontend MVP stable before backend integration
```

Prior related commits on `master`:

- `6292062` — Stable functional frontend before backend integration (STABILITY doc)
- `1d96892` — Initial MVP import

---

## Development Reminders

- Run **one** dev server: `npm run dev` or `npm run dev:clean`
- **Stop dev before** `npm run build` to avoid CSS cache corruption (see `docs/STABILITY.md`)
- Verify styling via CSS network **200**, not HTML status alone

**This document marks the frontend freeze line. Backend work begins below the service layer.**
