# Supabase Implementation

**Status:** PARTIALLY IMPLEMENTED (schema draft only)

---

## Current state

| Component | Status |
|-----------|--------|
| `supabase/schema.sql` | Draft — 7 tables, enums, RLS enabled |
| RLS policies | NOT IMPLEMENTED (commented examples only) |
| Migrations folder | NOT PRESENT |
| Production Supabase project | NOT CONFIRMED in this audit |
| `src/lib/supabase/client.ts` | Scaffold — returns null without env |
| Production services | `stubServices.ts` — all methods throw |

---

## Tables in schema.sql

- users, customers, contacts, deals, purchase_orders, follow_ups, activities

## Missing tables (required by frontend)

- email_threads, email_messages
- notifications
- automation_workflows, automation_steps, automation_executions
- sales_targets
- purchase_order_items
- storage buckets for PO documents

---

## Indexes / constraints

Minimal in current schema. Production needs indexes on:

- `customers(owner_id)`, `deals(customer_id)`, `deals(stage)`, `deals(owner_id)`
- `emails(deal_id)`, `emails(customer_id)`
- `follow_ups(due_date)`, `activities(entity_id)`

---

## Unresolved decisions

1. UUID vs string ID compatibility with existing mock data
2. Auth user ID mapping to `users` table
3. Soft delete vs cascade on customer/deal deletion
4. Email sync model (single table vs thread + messages)

See `docs/SUPABASE_PRODUCTION_CHECKLIST.md` for deployment verification steps.
