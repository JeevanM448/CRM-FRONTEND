# Email Implementation

**Status:** NOT IMPLEMENTED (production)

---

## Mock flow (current)

```
UI → emailService (mock) → crmStore → localStorage
AI → mock/aiService (client-side rules)
```

---

## Target production flow

```
Provider → webhook/sync → API → Postgres → Activity → AI job (server)
Send: UI → API → Provider → Postgres → Activity
```

---

## API contract

See `docs/API_CONTRACT.md` — endpoints not built.

---

## Human approval

AI Assist panel requires user to edit and click Send — preserve in production.

---

## BLOCKED

Requires email provider credentials + Phase 8 implementation.
