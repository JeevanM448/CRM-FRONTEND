# Production Authentication

**Status:** NOT IMPLEMENTED

---

## Current (mock)

- `/login` submits form → toast → redirect `/dashboard`
- No credential validation
- Session = `currentUserId` in localStorage
- Settings → "Simulate Role" switches user

---

## Target (Supabase Auth)

| Feature | Status |
|---------|--------|
| Sign in | PLANNED |
| Sign out | PLANNED |
| Session persistence | PLANNED |
| Protected routes | PLANNED |
| Password reset | PLANNED |
| OAuth (if required) | PLANNED |

---

## Redirect URLs (configure in Supabase when ready)

- Site URL: `https://<production-domain>`
- Redirect: `https://<production-domain>/auth/callback` (or Next.js route TBD)

---

## Known limitations (current)

- Any user can access all routes without login
- No server session
- No token refresh

---

## BLOCKED

Requires Phase 3 implementation + production Supabase Auth configuration.
