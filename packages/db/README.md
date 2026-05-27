# @classifly/db

Generated TypeScript types for the Supabase schema.

## Regenerate after schema changes

```bash
pnpm db:start       # if not already running
pnpm db:reset       # apply latest migrations
pnpm db:types       # writes packages/db/src/types.ts
```

The current `src/types.ts` is a hand-written subset of what `supabase gen types` produces, so the apps compile before you've set up the local DB. After your first `db:types` run it gets overwritten with the full generated version (~hundreds of tables/views) and `src/index.ts` keeps the convenient `Profile`, `Listing`, etc. aliases that the apps import.
