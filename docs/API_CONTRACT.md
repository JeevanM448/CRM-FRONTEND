# API Contract — Shiny Stone Sales OS

## Customers

- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id`

## Contacts

- `GET /api/contacts`
- `POST /api/contacts`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`

## Deals

- `GET /api/deals`
- `POST /api/deals`
- `GET /api/deals/:id`
- `PATCH /api/deals/:id`
- `PATCH /api/deals/:id/stage`
- `DELETE /api/deals/:id`

## Emails

- `GET /api/emails?folder=inbox`
- `POST /api/emails`
- `POST /api/emails/:id/reply`
- `PATCH /api/emails/:id/read`

## Purchase Orders

- `GET /api/purchase-orders`
- `POST /api/purchase-orders`
- `GET /api/purchase-orders/:id`
- `PATCH /api/purchase-orders/:id`
- `POST /api/purchase-orders/:id/extract`

## Follow-ups

- `GET /api/follow-ups`
- `POST /api/follow-ups`
- `PATCH /api/follow-ups/:id`
- `POST /api/follow-ups/:id/complete`

## Workflows

- `GET /api/workflows`
- `POST /api/workflows`
- `PATCH /api/workflows/:id`
- `DELETE /api/workflows/:id`
- `POST /api/workflows/:id/run`

## Documents (planned — not implemented)

- `GET /api/documents`
- `POST /api/documents` — multipart upload to private storage
- `GET /api/documents/:id`
- `PATCH /api/documents/:id`
- `POST /api/documents/:id/archive`
- `POST /api/documents/:id/delete-request`
- `GET /api/documents/:id/versions`
- `POST /api/documents/:id/versions` — new version upload
- `GET /api/documents/:id/download-url` — signed URL (short-lived)
- `GET /api/documents/:id/preview-url` — signed preview URL
- `POST /api/documents/:id/process` — body: `{ processingType: OCR | AI_EXTRACTION | … }`
- `GET /api/documents/:id/processing-history`
- `POST /api/documents/:id/approve-review`
- `POST /api/documents/:id/reject-review`

**Storage:** Private Supabase bucket `documents`. Path pattern:
`organizations/{organizationId}/documents/{documentId}/v{version}/{filename}`

**Security:** No public URLs. Signed URLs only. RLS by organization/team/user scope.

## System Health (planned — not implemented)

- `GET /api/system-health`
- `GET /api/system-health/services`
- `GET /api/system-health/services/:id`
- `GET /api/system-health/services/:id/history`
- `POST /api/system-health/check`

## Backups (planned — not implemented)

- `GET /api/backups`
- `GET /api/backups/:id`
- `POST /api/backups`
- `GET /api/recovery-points`
- `GET /api/recovery-points/:id`
- `POST /api/recovery-points/:id/restore` — server-side authorized restore
- `GET /api/backup-policy`
- `PATCH /api/backup-policy`

## Dashboard & Reports

- `GET /api/dashboard/metrics`
- `GET /api/reports?period=6m`

## Manager team scope (frontend mock + future API)

Scope is derived from the authenticated user — never from client-supplied `managerId` or `teamId`.

| Resource | Admin | Sales Manager | Salesperson |
|----------|-------|---------------|-------------|
| Contacts | Organization | Team (`MANAGER_TEAM`) | Own |
| Deals | Organization | Team | Own |
| Pipeline | Organization | Team deals by stage | Own |
| Inbox / emails | Organization | Team-linked threads | Own |

**Frontend selectors (mock):** `getTeamContacts`, `getTeamDeals`, `getTeamPipelineSummary`, `getTeamInboxSummary`, `getTeamPurchaseOrders`, `getTeamFollowUps`, `getManagerTeamTargetSummary`, `getTeamAutomationSummary`, `get*AccessStatus`

**Future API (examples):**

- `GET /api/contacts` — scoped list; `GET /api/contacts/:id` — 403 if outside scope
- `GET /api/deals` — scoped list; `GET /api/deals/:id` — 403 if outside scope
- `GET /api/manager/pipeline` — team pipeline aggregates
- `GET /api/emails?folder=inbox` — scoped threads; `GET /api/emails/:id` — 403 if outside scope

Authorization responses: `404` when record does not exist; `403` when record exists but viewer lacks scope.

## Example: Create Customer

```json
POST /api/customers
{
  "name": "ABC Corporation",
  "industry": "Manufacturing",
  "location": "Saudi Arabia",
  "contactName": "Ahmed Al-Rashid",
  "contactEmail": "ahmed@example.com",
  "contactPhone": "+966 50 123 4567",
  "ownerId": "user-2",
  "status": "active"
}
```

Response: `201` with full Customer object including computed `activeDeals`, `revenue`.
