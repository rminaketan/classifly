# Supabase

Source of truth for the database schema, RLS policies, and seed data. Everything in `migrations/` is applied in lexical order.

## Common commands

```bash
# Start local Supabase (Postgres + Auth + Storage + Studio at :54323)
pnpm db:start

# Reset DB and re-apply all migrations + seed
pnpm db:reset

# Create a new migration
supabase migration new <name>

# Push migrations to your linked remote project (run from CI usually)
pnpm db:push

# Regenerate TypeScript types from the live schema
pnpm db:types
```

## Migration policy

See `docs/02-database/migration_notes.md` — forward-only, additive first, no exclusive locks > 5 s, three-step ladder for destructive changes.

## OTP testing in local dev

Local Supabase ships with **InBucket** at `http://localhost:54324`. Trigger a phone OTP signup; the SMS body appears there. No real SMS gateway is wired in dev. For prod, configure MSG91 in the Supabase dashboard (Auth → Providers → Phone → MSG91).

## Files

| File | Contents |
|---|---|
| `config.toml` | Supabase CLI config — ports, auth settings, storage limits |
| `migrations/20260517000000_initial_schema.sql` | Extensions, enums, tables, indexes, triggers, FTS, helper fns |
| `migrations/20260517000001_rls_policies.sql` | Row-Level Security policies for every table |
| `migrations/20260517000002_dev_seed.sql` | Cities, categories, attribute schemas, feature flags |
| `seed.sql` | Loader stub (the real seed lives in the dated migration) |
