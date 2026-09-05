# Data Model — Shiny Stone Sales OS

**Source of truth:** `src/types/index.ts`, `src/store/types.ts`  
**Database target:** `supabase/schema.sql` (partial — see gaps below)

---

## Entities

### User
| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID in DB target) | |
| name, email | string | |
| role | admin \| sales_manager \| salesperson \| viewer | |
| department, title, avatar | string | |
| status | EntityStatus | |
| lastActive | ISO datetime | |

### Customer
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| name, industry, location | string | |
| ownerId, owner | string | owner name denormalized in frontend |
| contactName, contactEmail, contactPhone | string | embedded primary contact |
| activeDeals, revenue | number | **computed** in mock via `enrichCustomer()` |
| lastActivity | ISO datetime | |
| status | EntityStatus | |

### Contact
Linked to Customer via `companyId`.

### Deal
| Field | Type | Notes |
|-------|------|-------|
| stage | new \| qualified \| quotation \| negotiation \| won \| lost | |
| value, probability | number | |
| customerId, ownerId | string | |
| emailCount, poStatus, followUpStatus | optional | **computed** via `enrichDeal()` |

### EmailThread / EmailMessage
Folders: inbox, sent, drafts, important, follow-ups. Optional `customerId`, `dealId`. AI fields: `aiSummary`, `aiIntent`, `aiSuggestedAction`.

### PurchaseOrder / POItem
Statuses: pending, received, approved, processing, completed, cancelled. Document metadata only in mock (no blob).

### DocumentRecord / DocumentVersionRecord / DocumentProcessingRecord
**Source:** `src/store/documents.ts`  
**Storage version:** 14 (`documents`, `document-versions`, `document-processing` keys)

| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| organizationId | string | |
| name, originalFileName | string | |
| mimeType, extension | string | |
| sizeBytes | number | metadata only in mock |
| storageProvider | mock \| supabase \| future_provider | |
| storagePath | string | mock: `mock://documents/{id}/v{n}/{filename}` |
| storageBucket | string | future: private `documents` bucket |
| status | ACTIVE \| ARCHIVED \| DELETED_PENDING \| PROCESSING \| REQUIRES_REVIEW \| APPROVED \| REJECTED \| FAILED | lifecycle |
| category | purchase_order \| invoice \| quote \| … | |
| entityType, entityId | CRM link | customer, deal, PO, email, etc. |
| source, sourceId | string | manual_upload, email, automation, … |
| ocrStatus, aiProcessingStatus, extractionStatus | processing enum | separate from lifecycle status |
| reviewStatus | automatic \| requires_review \| approved \| rejected | |
| version | number | current active version |
| tags, description, checksum | | |

**No binary content in localStorage.** Future Supabase path:
`organizations/{organizationId}/documents/{documentId}/v{version}/{filename}`

### SystemHealthServiceStatus / HealthCheckRecord / SystemIncidentRecord
**Source:** `src/store/systemHealth.ts`  
Mock-only operational readiness — no live probes.

### BackupRecord / RecoveryPointRecord / BackupRetentionPolicy
**Source:** `src/store/backups.ts`  
Mock backup metadata — no real export/restore.

### FollowUp
Statuses: overdue, today, upcoming, completed (computed from due date in mock).

### Activity
Audit timeline: type, title, description, entityType, entityId, customerId, dealId, actorId, timestamp.

### AutomationWorkflow / AutomationStep
Trigger/action steps; `lastRun` on workflow.

### AppNotification, SalesTargetRecord, AppSettings
See `src/store/types.ts`.

---

## Relationships

```
Customer
 ├── Contacts (companyId)
 ├── Deals (customerId)
 │    ├── Emails (dealId)
 │    ├── PurchaseOrders (dealId)
 │    ├── Follow-ups (dealId)
 │    └── Activities (dealId / customerId)
 ├── Emails (customerId)
 ├── PurchaseOrders (customerId)
 ├── Follow-ups (customerId)
 └── Activities (customerId)
```

---

## Schema gaps (supabase/schema.sql vs frontend)

| Frontend entity | In schema.sql? |
|-----------------|----------------|
| users, customers, contacts, deals | Yes |
| purchase_orders | Yes (missing items, document fields) |
| follow_ups | Yes (missing priority, description) |
| activities | Yes (missing actorId, customerId, dealId) |
| emails / email_threads | **No** |
| notifications | **No** |
| automation workflows/steps/executions | **No** |
| sales_targets | **No** |
| storage (PO documents) | **No** |

---

## ID strategy

- **Frontend mock:** prefixed strings (`cust-`, `deal-`) via `generateId()`
- **Production target:** UUID (schema.sql). Migration must map or regenerate IDs.
