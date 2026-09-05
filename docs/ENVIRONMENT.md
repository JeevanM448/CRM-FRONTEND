# Environment Variables

**Never commit real values.** Use `.env.local` locally; configure secrets in hosting provider (e.g. Vercel).

---

## Variable reference

| Variable | Purpose | Server/Client | Dev required | Prod required |
|----------|---------|---------------|--------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client | No (mock mode) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Client | No (mock mode) | Yes |
| `NEXT_PUBLIC_USE_MOCK_SERVICES` | `true` = mock store; `false` = production services | Client | Yes (default `true`) | `false` when backend ready |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB ops, server only | **Server only** | No | Yes (API routes/Edge) |
| `OPENAI_API_KEY` | AI classification/extraction | **Server only** | No | Yes (when AI enabled) |
| `GOOGLE_CLIENT_ID` | Gmail OAuth | **Server only** | No | If Gmail approved |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth | **Server only** | No | If Gmail approved |
| `GOOGLE_REDIRECT_URI` | OAuth callback | Server | No | If Gmail approved |
| `MICROSOFT_CLIENT_ID` | Graph OAuth | **Server only** | No | If Outlook approved |
| `MICROSOFT_CLIENT_SECRET` | Graph OAuth | **Server only** | No | If Outlook approved |
| `MICROSOFT_TENANT_ID` | Azure AD tenant | Server | No | If Outlook approved |

---

## Not used in current implementation

These appear in the master deployment prompt but are **not wired in code**:

- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — auth not implemented via NextAuth; target is Supabase Auth

Do not add unused variables to production until implemented.

---

## Git safety

Ignored by `.gitignore`:

- `.env`
- `.env*.local`
- `.env.production`

---

## Local development (current)

```bash
cp .env.example .env.local
# Leave NEXT_PUBLIC_USE_MOCK_SERVICES=true
npm install
npm run dev:clean
```

No Supabase credentials required for mock mode.
