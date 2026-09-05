# Production AI Checklist

**Status:** NOT READY

| Feature | Mock | Production |
|---------|------|------------|
| Email classify | Keyword rules | BLOCKED |
| Email summarize | Client | BLOCKED |
| Generate reply | Template strings | BLOCKED |
| PO extract | Fake confidence 96% | BLOCKED |
| Deal insight | Heuristics | BLOCKED |
| Keys server-side | N/A | BLOCKED |
| Timeout/fallback | Partial (UI) | BLOCKED |
| No auto-send | PASS (UI requires click) | Must preserve |

---

## Human-in-the-loop verification

- AI Assist Send calls `emailService.sendEmail()` only on user action — **PASS in mock UI**
- PO approve requires user Save — **PASS in mock UI**
- Deal stage change is manual — **PASS**

---

## BLOCKED

`OPENAI_API_KEY` (or approved provider) + Phase 9 server routes.
