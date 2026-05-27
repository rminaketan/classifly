# Migration Notes & Future Schema Changes

This document captures the **rules** for writing migrations on the lean stack and the **playbooks** for the schema changes we expect to make when revenue triggers them.

## Rules for every migration

1. **Forward-only.** Every migration moves the schema forward; never write a down migration. Rollback = ship a new forward migration that undoes the change.
2. **Additive first.** Add columns nullable. Backfill in a follow-up migration. Make non-null in a third migration, in a later release.
3. **No exclusive locks > 5 seconds.** Set `lock_timeout = '5s'; statement_timeout = '5min';` at the top of every migration. If you'd take a longer lock, find a non-blocking way.
4. **Use `CREATE INDEX CONCURRENTLY`** when adding indexes on tables with > 100 K rows.
5. **Never drop a column in the same release that stops writing it.** Three-step ladder:
   - Release N: code stops reading the column.
   - Release N+1: code stops writing the column.
   - Release N+2: migration drops the column.
6. **Snapshot before destructive changes.** The migration workflow runs `pg_dump` to `classifly-backups-prod/db/...` before applying.
7. **One concept per migration file.** Easier to review, easier to revert.
8. **Test on dev first.** No PR with a migration may merge to `main` until it has run cleanly on `develop`.

## Anatomy of a safe migration

```sql
-- supabase/migrations/20260601_120000_add_listing_price_per_unit.sql

SET lock_timeout = '5s';
SET statement_timeout = '5min';

-- Step 1: add nullable column (cheap, non-blocking)
ALTER TABLE listings
  ADD COLUMN price_per_unit numeric(12,2);

-- Step 2: backfill in chunks (run after deploy in a separate migration)
-- UPDATE listings SET price_per_unit = ... WHERE id IN (next 1000); etc.

-- Step 3: add index concurrently (later migration)
-- CREATE INDEX CONCURRENTLY idx_listings_ppu ON listings(price_per_unit) WHERE price_per_unit IS NOT NULL;
```

## SQL lint we enforce in CI

A small custom checker in `.github/workflows/api-migrate.yml` rejects PRs whose migration files contain:

- `DROP TABLE`, `DROP COLUMN`, `DROP TYPE` without a comment `-- safe: <reason>` on the same line.
- `ALTER TABLE … ADD COLUMN … NOT NULL` without a `DEFAULT`.
- `ALTER TABLE … ALTER COLUMN … SET NOT NULL` without a preceding backfill migration in the prior release.
- `CREATE INDEX` (non-concurrent) on tables known to be large (`listings`, `messages`, `audit_log`, `listing_views`).

---

## Playbooks for the major schema-shape changes ahead

### A. Add Meilisearch alongside Postgres FTS (Trigger: listings > 100 K)

We keep Postgres as the source of truth and Meilisearch as a derived index.

1. **Provision** a Meilisearch instance on an Oracle Cloud Always Free ARM VM (24 GB RAM, free forever). Persist the index volume.
2. **Schema change:** add `last_indexed_at timestamptz` to `listings`.
3. **Application change:** introduce `SearchClient` abstraction with two implementations (`PostgresFTSSearchClient`, `MeilisearchSearchClient`). Feature-flag the switchover (`feature.search.meili = false → true`).
4. **Initial backfill:** background job streams `SELECT * FROM listings WHERE status='active'` to Meilisearch in 5 K batches.
5. **Incremental sync:** Postgres trigger inserts into a `search_outbox` table; a Cloudflare Worker reads the outbox every 30 s and pushes diffs to Meilisearch.
6. **Cutover:** flip the flag in `feature_flags`; monitor for 7 days; remove Postgres FTS path.

### B. Partition `messages` by month (Trigger: messages > 10 M)

Postgres native range partitioning. We convert `messages` from a single table to a partitioned table without taking it offline.

1. Create new partitioned table `messages_p`:
   ```sql
   CREATE TABLE messages_p (LIKE messages INCLUDING ALL) PARTITION BY RANGE (created_at);
   CREATE TABLE messages_p_default PARTITION OF messages_p DEFAULT;
   -- Then pre-create monthly partitions for the next 12 months
   ```
2. **Dual-write** from the API for 24 h (insert into both `messages` and `messages_p`).
3. **Backfill** old rows into `messages_p` in time-ordered batches.
4. **Switch reads** to `messages_p` via a view named `messages` (rename the original first).
5. **Drop dual-write**, drop old `messages` table.
6. **Monthly cron** creates the next partition and detaches partitions older than retention (default 24 months).

Same playbook applies later to `listing_views` and `audit_log`.

### C. Move from Supabase Free → Supabase Pro (Trigger: DB > 400 MB sustained)

1. Click the upgrade button. ~30-second downtime (none in practice).
2. Enable PITR (point-in-time recovery) — included on Pro.
3. Increase `max_connections` limit; reconfigure PgBouncer pool size in app env.
4. Enable daily backups to your own R2 bucket via Supabase webhook.

Cost: $25 / month (~₹2 100). 8 GB DB, 100 GB egress.

### D. Move from Supabase → Self-hosted Postgres (Trigger: DB > 50 GB or QPS > 500)

1. Provision **RDS for PostgreSQL** (Multi-AZ, ap-south-1) or self-host on **Hetzner CCX33** (16 GB RAM, ~₹4 000/mo).
2. Enable logical replication from Supabase to the new instance.
3. **Application change:** replace Supabase Auth with Auth.js (or keep Supabase Auth pointed at the external DB via Supabase's external-DB integration on Enterprise — usually not worth the cost).
4. **Cutover** during a 5-minute maintenance window: stop writes, wait for replication lag = 0, repoint app, resume.
5. Run the **enterprise CI/CD pipeline** for migrations from this point.

### E. Shard `listings` by `city_id` using Citus (Trigger: write QPS > 1 K)

Skip Citus until you genuinely need it. A vertical scale of Postgres to 64 vCPU + 256 GB RAM handles many millions of users.

When you do need it:

1. Add Citus extension to the Postgres cluster (Citus 12+ supports schema-based sharding which is simpler).
2. Pick `listings.city_id` as the distribution column (high cardinality, even distribution across India's top 30 cities).
3. Use Citus's online distribution tool: `SELECT create_distributed_table('listings', 'city_id');`
4. Update queries that span shards to use Citus-aware patterns (most `WHERE city_id = $1` queries are already shard-local).

### F. Add ClickHouse for analytics (Trigger: dashboards need sub-second on > 100 M rows)

1. Provision **ClickHouse Cloud** dev tier (free 1 TB-month for 30 days, then ~$50/mo) or self-host on a beefy Hetzner box.
2. Stream Postgres WAL → ClickHouse via **Materialize** or **PeerDB** or **Supabase webhooks → Kafka → ClickHouse**.
3. Build dashboards in Metabase (free self-host) or Grafana.

### G. Soft-delete vs hard-delete cleanup (housekeeping)

We soft-delete via `status = 'removed'`. Two background jobs to add by M3:

- Hard-delete listings with `status='removed' AND removed_at < now() - interval '90 days'`, cascading their media in R2.
- Hard-delete messages whose conversation has been archived by both parties for > 1 year (DPDP-friendly).

Implemented as Supabase Edge Function triggered nightly by a Cloudflare cron.

---

## Things explicitly **not** worth doing yet

- **Schema-per-tenant** — we are a marketplace, not a B2B SaaS. One schema for everyone.
- **Custom Postgres extensions** in C — fragile, vendor-incompatible, premature.
- **Logical replication for read scaling on free tier** — Supabase free doesn't allow it; vertical scaling on Pro is fine until ₹15 L/mo revenue.
- **Native PostgreSQL JSON schema validation** (the `pg_jsonschema` extension) — handy but not on Supabase free. Validate at the API layer for now.
- **`pg_stat_statements` analysis automation** — manual query review is fine until > 100 K MAU.

Re-read this file every time you write a migration. It will save you a production incident.
