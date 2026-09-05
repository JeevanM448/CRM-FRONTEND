# PO Requirements

**Status:** SIMULATED — UI complete; storage/extraction mock

---

## Lifecycle (matches frontend)

pending → received → approved → processing → completed / cancelled

---

## Fields

Match `PurchaseOrder` in `src/types/index.ts`: poNumber, customer, deal, amount, dates, tax, total, items, document metadata, aiConfidence.

---

## Flow

1. Upload document (metadata only in mock)
2. Create PO linked to customer + deal
3. AI extract (mock math/rules)
4. Human review on detail page
5. Approve → activity + notifications in mock store

---

## Production requirements

- Secure file storage
- Server-side extraction API
- RLS on PO + storage objects
- No public document URLs

---

## BLOCKED

Phase 10 + storage bucket + AI server.
