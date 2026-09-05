# Email Integration (Requirements)

**Status:** PLANNED — inbox is simulated

---

## Approved provider

**TBD by project stakeholder.** Architecture supports Gmail API or Microsoft Graph — implement **one** approved provider first.

---

## Requirements

- OAuth connection (no password storage)
- Inbox + sent sync
- Thread model matching `EmailThread` / `EmailMessage`
- Link to customer and deal
- Outbound send + reply through provider
- Activity on receive/send
- AI processing after store (server-side)

---

## Current mock

Seed data in `mockEmailThreads`; `sendEmail()` writes to local store only.

See `docs/EMAIL_IMPLEMENTATION.md` and `docs/PRODUCTION_EMAIL_CHECKLIST.md`.
