# AI Requirements

**Status:** SIMULATED in frontend; production NOT IMPLEMENTED

---

## Features (UI expects)

### Email AI
- Classification (intent, priority)
- Summary
- Suggested reply (human must review before send)
- Follow-up recommendation

### PO AI
- Field extraction from document
- Confidence score
- Human review before save/approve

### Deal AI
- Risk / attention insight
- Recommended action
- Uses probability + last activity

---

## Current implementation

`src/services/mock/aiService.ts` — keyword rules, no LLM.

`AIService` interface defined; production stub throws.

---

## Production requirements

- All AI keys server-side only (`OPENAI_API_KEY` or approved provider)
- Timeout + fallback UI messages
- No auto-send email, auto-approve PO, auto stage change
- Log requests without PII in production logs

See `docs/PRODUCTION_AI_CHECKLIST.md`.
