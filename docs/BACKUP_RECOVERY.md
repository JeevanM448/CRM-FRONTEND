# Backup & Recovery

**Status:** DOCUMENTED ONLY — backups not confirmed configured.

---

## Database backup

**Procedure (Supabase):**

1. Enable Point-in-Time Recovery (PITR) on production project (Pro plan).
2. Schedule logical backups via Supabase dashboard or `pg_dump` for off-platform copy.
3. Document recovery RPO/RTO with operations team.

**Rollback:**

1. Identify migration version to revert.
2. Apply down migration or restore from backup snapshot.
3. Verify RLS policies after restore.

**Not confirmed:** No production Supabase project audited in this task.

---

## Storage backup

PO documents (when implemented) should use Supabase Storage with:

- Versioning if available
- Cross-region replication per org policy
- Restore test quarterly

---

## Application rollback

**Vercel (if used):**

1. Deployments → select previous successful deployment → Promote to Production.
2. Verify env vars unchanged.

**Database compatibility:** Ensure rolled-back app version matches schema version.

---

## Recovery procedure

1. Declare incident; freeze writes if data integrity unknown.
2. Restore DB from latest clean backup.
3. Redeploy last known good application build.
4. Run smoke tests (`docs/PRODUCTION_QA.md`).
5. Document post-incident review.

---

## Responsible team

Assign before pilot: **Database owner**, **Application owner**, **On-call contact**.

---

## Demo / mock mode

Mock data in browser `localStorage` is **not backed up**. Demo reset in Settings clears all local data. Not suitable for production business records.
