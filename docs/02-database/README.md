# Phase 2 — Database Schema (Lean / Supabase-Postgres)

This is the **lean-track schema** for Classifly.in: a single PostgreSQL database (Supabase free tier) that holds every entity in the marketplace. No Elasticsearch, no Redis-as-database, no Kafka-as-event-store, no separate analytics warehouse — all of that comes later (see `Lean_Bootstrap_Architecture.md` §4 for migration triggers).

## Why a single database

- Supabase free tier (500 MB, 50K MAU) is enough for the first ~25K users with disciplined indexing.
- Postgres natively gives us: relational integrity, JSONB for flexible attributes, full-text search (`tsvector` + `pg_trgm`), geo queries (PostGIS), row-level security, triggers, materialized views, logical replication, and via Supabase Realtime, push-style event streams.
- We avoid the operational tax of running 5 different datastores while we're still finding product-market fit.

## Files in this folder

| File | What it contains |
|---|---|
| `README.md` | This overview |
| `ERD.md` | Mermaid entity-relationship diagram |
| `schema.sql` | Full DDL: extensions, enums, tables, indexes, triggers, FTS, functions |
| `rls_policies.sql` | Row-Level Security policies for every table |
| `seed.sql` | Sample categories, cities, demo listings (idempotent) |
| `storage.md` | Cloudflare R2 / Supabase Storage bucket layout |
| `migration_notes.md` | Rules for writing safe migrations + upgrade triggers |

## How to apply

```bash
# Local dev
supabase init                       # one-time
supabase migration new initial_schema
# paste schema.sql into the generated file
supabase migration new rls
# paste rls_policies.sql
supabase db reset                   # rebuild local DB
supabase db seed                    # apply seed.sql

# Push to remote
supabase link --project-ref <your-project>
supabase db push
```

## Domain at a glance

| Domain | Tables |
|---|---|
| **Identity & KYC** | `profiles`, `kyc_verifications`, `user_blocks`, `push_tokens` |
| **Taxonomy & geo** | `categories`, `category_attributes`, `cities`, `localities` |
| **Listings core** | `listings`, `listing_media`, `listing_attributes`, `saved_listings`, `saved_searches`, `listing_views` |
| **Jobs vertical** | `jobs`, `job_applications`, `resumes` |
| **Services vertical** | `services`, `service_bookings` |
| **Chat** | `conversations`, `messages`, `message_attachments` |
| **Trust & safety** | `reports`, `moderation_actions`, `fraud_signals` |
| **Reviews** | `reviews` |
| **Commerce** | `orders`, `payments`, `subscriptions`, `ledger_entries` |
| **Notifications** | `notifications` |
| **Admin** | `audit_log`, `feature_flags` |

Roughly **30 tables** total. Compare with ~80 tables in the enterprise version once microservices have their own per-service schemas.

## Capacity targets for this design

| Metric | Comfortable on Supabase Free | Comfortable on Supabase Pro ($25/mo) | Migrate when |
|---|---|---|---|
| Total DB size | 500 MB | 8 GB | DB > 6 GB sustained |
| Listings (live) | ~100 K | ~1 M | > 1 M live listings |
| Messages | ~500 K | ~10 M | > 10 M total |
| Concurrent connections | 60 | 200 | > 150 sustained |
| Storage (R2) | 10 GB free | 10 GB free + ~₹1.5/GB | > 100 GB |
| Read QPS | ~50 | ~500 | > 400 sustained |

## Key design choices

1. **Profiles extend `auth.users`** (Supabase manages identity). We don't duplicate email/phone/password.
2. **Listings is the spine.** Jobs and Services have their own tables but reference `listings` so search, moderation, media, chat, and reporting are uniform across verticals.
3. **JSONB for category-specific attributes.** Mobiles have `ram`, `storage`; cars have `fuel_type`, `kms_driven`. We store these in `listing_attributes.attrs` (JSONB) with a per-category JSON schema validated at the application layer. Queryable via GIN index.
4. **Search via Postgres FTS.** Each listing has a generated `tsvector` column (`title` + `description` + city + category name) with a GIN index. Trigram index on `title` enables fuzzy autocomplete.
5. **Geo via PostGIS.** `location geography(Point, 4326)` on listings + GIST index for radius queries.
6. **RLS everywhere.** Every table has policies. Supabase's `auth.uid()` function gives the current user's id to the policy.
7. **Soft deletes via `status` enum**, not `DELETE`. Lets us recover, audit, and moderate without losing data.
8. **Audit log via trigger.** Sensitive tables write to `audit_log` automatically.
9. **No stored procedures for business logic.** Triggers are limited to `updated_at`, audit, counter denorm, and FTS refresh. Logic lives in the API layer.
10. **All identifiers are UUIDv7** (time-sortable, index-friendly) using the `uuidv7()` SQL function included in the schema.

## Migration triggers (when this schema needs to change shape)

| Trigger | Action |
|---|---|
| Listings cross 100 K | Add Meilisearch alongside Postgres FTS; keep Postgres as source of truth |
| Messages cross 10 M | Partition `messages` by month (range partitioning) |
| Single DB exceeds 100 GB | Move to dedicated Postgres (RDS or self-hosted on Hetzner) |
| Write QPS > 1 K | Shard `listings` by `city_id` using Citus |
| Need real-time analytics | Add ClickHouse; mirror events via Kafka or Supabase WAL → ClickHouse pipeline |
| Need cross-region read | Promote a read replica in `ap-south-2` |

Each trigger is documented in `migration_notes.md` with the SQL needed to perform the change with zero downtime.
