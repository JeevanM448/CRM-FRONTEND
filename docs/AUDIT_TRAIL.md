# Audit Trail

**Status:** SIMULATED (mock store); production NOT IMPLEMENTED

---

## Mock implementation

- `crmStore.addActivity()` on mutations
- Max 100 activities in memory/localStorage
- Fields: type, title, description, entityType, entityId, customerId, dealId, actorId, timestamp

---

## Events recorded (mock)

Customer/contact/deal CRUD, stage changes, email send/link, PO create/approve, follow-up create/complete, workflow run.

---

## Production requirements

- Server-generated immutable log
- No user edit/delete of audit rows
- RLS: read via entity access
- Pagination for timeline

---

## Gap vs schema.sql

Production `activities` table missing: `actor_id`, `customer_id`, `deal_id`, `user_id`.

---

## Verification

Mock script confirms activities on stage move — PASS (local only).
