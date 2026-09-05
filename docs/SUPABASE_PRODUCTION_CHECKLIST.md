# Supabase Production Checklist

**Status:** NOT READY — use before internal pilot only after backend phases complete.

| Item | Status | Notes |
|------|--------|-------|
| **Database** | FAIL | Partial schema only; not applied to confirmed prod project |
| **RLS** | FAIL | Enabled on tables; zero active policies |
| **Storage** | NOT IMPLEMENTED | No buckets or policies for PO documents |
| **Auth** | NOT IMPLEMENTED | Supabase Auth not wired to `/login` |
| **Indexes** | FAIL | Missing performance indexes |
| **Migrations** | NOT IMPLEMENTED | No versioned migration files |
| **Backup** | NOT CONFIRMED | Enable Supabase PITR/backups in project settings |

---

## Pre-pilot verification (when implemented)

- [ ] All tables from `DATA_MODEL.md` exist
- [ ] Foreign keys match relationship diagram
- [ ] RLS policies tested per role (admin, sales_manager, salesperson, viewer)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used only on server
- [ ] Anon key cannot bypass RLS
- [ ] Storage bucket private; signed URLs for PO download
- [ ] Auth redirect URLs match production domain
- [ ] Seed data removed or isolated to dev project

---

## BLOCKED

Cannot complete this checklist without:

1. Production Supabase project credentials
2. Completed schema migrations (Phase 2)
3. RLS policy implementation (Phase 4/16)
