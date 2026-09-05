# Deployment Guide

**Status:** Frontend deployable; **full CRM platform NOT production-ready**

---

## 1. Hosting setup (Vercel recommended for Next.js 15)

- Connect Git repository
- Framework: Next.js
- Build command: `npm run build`
- Output: default (`.next`)
- Node: 20.x

---

## 2. Environment variables

Set in Vercel project settings (placeholders only — use real values from secure store):

| Variable | Required for mock demo | Required for full prod |
|----------|------------------------|-------------------------|
| `NEXT_PUBLIC_USE_MOCK_SERVICES` | `true` | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Yes (server) |
| Email OAuth vars | No | If email enabled |
| `OPENAI_API_KEY` | No | If AI enabled |

See `docs/ENVIRONMENT.md`.

---

## 3. Supabase setup

1. Create project
2. Run migrations from completed schema (not just draft `schema.sql`)
3. Enable Auth providers
4. Configure RLS — see `SUPABASE_PRODUCTION_CHECKLIST.md`

---

## 4. Database migration

Use Supabase CLI or SQL editor. **Do not** apply partial schema to production without missing tables plan.

---

## 5. RLS

Mandatory before multi-user pilot. See `AUTHORIZATION.md`.

---

## 6. Storage

Create private bucket `purchase-orders` with authenticated read/write policies.

---

## 7. Authentication

Configure Supabase Auth redirect URLs to match production domain.

---

## 8. Email (Gmail or Outlook)

Configure OAuth app + server callback route when Phase 8 complete.

---

## 9. AI setup

Server-side API route or Edge Function with `OPENAI_API_KEY` — never `NEXT_PUBLIC_`.

---

## 10. Domain

Add custom domain in Vercel; update Supabase Auth redirect URLs.

---

## 11. OAuth redirect URLs

Example pattern (replace domain):

- `https://app.shinystone.com/auth/callback`
- `https://app.shinystone.com/api/email/callback`

---

## 12. Deployment procedure

```bash
npm install
npm run build   # must pass locally first
git push        # triggers Vercel build
```

Verify deployed URL routes + CSS (see STABILITY.md).

---

## 13. Rollback

Vercel → Deployments → Promote previous deployment.

Coordinate DB rollback if schema changed — see `BACKUP_RECOVERY.md`.

---

## 14. Backup/recovery

Enable Supabase backups before pilot. See `BACKUP_RECOVERY.md`.

---

## Current recommendation

Deploy **only for UI demo** with `NEXT_PUBLIC_USE_MOCK_SERVICES=true` and **no sensitive data**.

Do **not** market as production CRM until backend phases complete.
