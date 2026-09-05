# Shiny Stone Sales OS — Backend Handoff

## Application Modules

1. Dashboard — KPI aggregation, activity feed, attention deals
2. Customers — CRUD, detail tabs, relationship graph
3. Contacts — CRUD linked to customers
4. Deals — CRUD, stage management, AI insights
5. Pipeline — Kanban drag/drop stage updates
6. Inbox — Simulated email folders, compose, link to CRM
7. Purchase Orders — Upload metadata, AI extraction review
8. Follow-ups — Task lifecycle (create, complete, reschedule)
9. Automation — Workflow CRUD and test execution
10. Reports — Dynamic metrics and charts
11. Users — Admin user management
12. Settings — Profile, company, AI toggles, demo tools

## Entity Models

See `src/types/index.ts` and `src/store/types.ts`.

Core entities: Customer, Contact, Deal, EmailThread, PurchaseOrder, FollowUp, Activity, AutomationWorkflow, User, Notification, SalesTarget.

## Relationships

```
Customer → Contacts → Deals → Emails → Purchase Orders → Follow-ups → Activities
```

## CRUD Operations

All operations are implemented in `src/store/crmStore.ts` with localStorage persistence. Mock async wrappers live in `src/services/mock/*`.

## Required API Endpoints

See `docs/API_CONTRACT.md`.

## Authentication

- Frontend simulates roles via `currentUserId` in localStorage
- Backend must implement Supabase Auth + RLS policies per role

## Role Permissions

| Role | Access |
|------|--------|
| Admin | Full access |
| Sales Manager | Team data + reports |
| Salesperson | Own operational records |
| Viewer | Read-only |

## Email Integration

Placeholder UI only. Backend needs OAuth for Gmail/Outlook and webhook/sync pipeline.

## PO Upload

Frontend stores file metadata only. Backend needs storage bucket + OCR/AI extraction service.

## AI Integration

Deterministic mock in `src/services/mock/aiService.ts`. Replace with LLM API maintaining same response shape.

## Dashboard Calculations

- Total Sales = sum of won deal values
- Pipeline Value = sum of active deal values
- Pending POs = count where status in pending/received/approved/processing
- Target achievement = totalSales / salesTargets sum

## Data Validation

See `src/lib/validation.ts` for frontend rules to mirror on backend.

## Frontend Assumptions

- IDs are UUID-prefixed strings
- Currency default INR
- All timestamps ISO 8601
- AI outputs always require user confirmation before send
