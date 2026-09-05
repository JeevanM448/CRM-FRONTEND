# Functional QA

**Status:** PASS (mock mode) / FAIL (production)

---

## Test environment

- Local `npm run build` + `npm start` or `npm run dev:clean`
- `NEXT_PUBLIC_USE_MOCK_SERVICES=true`
- Automated: `npx tsx scripts/test-relationships.ts`

---

## Relational workflow (automated)

| Step | Result |
|------|--------|
| Create customer → list | PASS |
| Create deal → customer + pipeline | PASS |
| Email → deal/customer history | PASS |
| Follow-up → list + deal | PASS |
| PO → deal + approve | PASS |
| Stage move → activity | PASS |
| Deal won → dashboard metrics | PASS |

---

## Manual routes (prior checkpoint)

All 13 primary routes: HTTP 200 + CSS + content — PASS

---

## Not tested (production)

- Real auth session
- Cross-user data isolation
- Email provider round-trip
- PO file storage
- Server-side validation

See `docs/FINAL_DEMO_REPORT.md` for 20-step business demo status.
