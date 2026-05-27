# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Classifly.in — an Indian classifieds marketplace (goods, jobs, services, real estate). pnpm monorepo: Next.js 14 web app + Flutter mobile skeleton + shared TypeScript packages + Supabase Postgres.

**Two-track architecture, only one is implemented.** The code in this repo implements the **Lean Bootstrap** track (~₹0/month infra: Supabase + Cloudflare Pages + R2 + Upstash). The **Enterprise** track in [docs/01-architecture/Classifly_Architecture_Phase1.md](docs/01-architecture/Classifly_Architecture_Phase1.md) is a target endgame; do not introduce its components (K8s, microservices, separate API gateway, etc.) into the current code. When picking solutions, default to lean primitives unless the user explicitly says otherwise.

## Common commands

```bash
pnpm install
pnpm dev               # web only on http://localhost:3000
pnpm build             # all workspaces
pnpm lint              # all
pnpm type-check        # tsc --noEmit across all
pnpm test              # vitest (currently only apps/web has tests)
pnpm format            # prettier

# Local Supabase (requires Docker Desktop running)
pnpm db:start          # boots Postgres + Auth + Storage in containers
pnpm db:stop
pnpm db:reset          # rebuild + apply migrations + dev seed
pnpm db:diff           # see drift vs migrations
pnpm db:push           # push migrations to linked remote project
pnpm db:types          # regenerate packages/db/src/types.ts from local DB

pnpm mobile:dev        # cd apps/mobile && flutter run
```

Run a single vitest file: `pnpm --filter web test -- path/to/file.test.ts`. Tests run via `vitest run` (non-watch) from [apps/web/package.json](apps/web/package.json).

Local-dev SMS sink: when sending phone OTPs against local Supabase, the OTP is delivered to **InBucket** at http://localhost:54324, not a real phone.

## Architecture

### Monorepo layout
- [apps/web/](apps/web/) — Next.js 14 App Router. Server Components + Server Actions + Route Handlers. Production source.
- [apps/mobile/](apps/mobile/) — Flutter skeleton (screens are placeholders). Materialize platform folders with `flutter create . --platforms=android,ios --org in.classifly` before `flutter run`.
- [packages/db/](packages/db/) — generated Supabase types. **Do not edit [packages/db/src/types.ts](packages/db/src/types.ts) by hand**; regenerate via `pnpm db:types`.
- [packages/shared/](packages/shared/) — Zod schemas and Indian-locale helpers (`formatINR`, `timeAgo`, phone mask). The Zod schemas in [packages/shared/src/schemas.ts](packages/shared/src/schemas.ts) are the single source of truth for API request/response shapes — both web (server actions) and mobile validate against them. They mirror DB constraints in [supabase/migrations/](supabase/migrations/); changing one usually means changing the others.
- [packages/ui/](packages/ui/) — design tokens consumed by Tailwind (web) and Flutter (mobile).

Workspace deps use `workspace:*` (e.g. `@classifly/db`, `@classifly/shared`).

### Supabase as the backend
There is no separate API server. The web app talks to Postgres directly via three Supabase clients in [apps/web/src/lib/supabase/](apps/web/src/lib/supabase/):
- **`createSupabaseServerClient()`** — anon-key client honoring the user's auth cookie. Use in Server Components, Route Handlers, Server Actions. **RLS applies.**
- **`createSupabaseAdminClient()`** — service-role client that **bypasses RLS**. Use only after your own authorization check (webhooks, admin routes, trusted server jobs). Never reach for this just because RLS is in the way — fix the policy or the query.
- **`createBrowserClient()`** (in [client.ts](apps/web/src/lib/supabase/client.ts)) — browser-side, used by Realtime subscriptions (chat).

[apps/web/src/middleware.ts](apps/web/src/middleware.ts) calls `updateSession()` on every request to refresh the auth cookie. When env vars are missing, `isConfigured` (in [lib/env.ts](apps/web/src/lib/env.ts)) is false and the middleware no-ops + the home page renders [SetupScreen](apps/web/src/components/SetupScreen.tsx) instead of crashing — preserve this graceful-degradation behavior.

### Auth
Phone-OTP only (no email/password in user flows). E.164 form `+91XXXXXXXXXX`, validated by `phoneE164` in [packages/shared/src/schemas.ts](packages/shared/src/schemas.ts). Local dev OTPs land in InBucket; production uses MSG91 (configured in Supabase dashboard, not [supabase/config.toml](supabase/config.toml)).

### Database migrations are forward-only
Migrations in [supabase/migrations/](supabase/migrations/) are append-only. To change schema, **add a new timestamped migration**, never edit an existing one — even pre-launch (see [docs/02-database/migration_notes.md](docs/02-database/migration_notes.md)). After applying locally, run `pnpm db:types` to refresh TS types.

RLS policies live in their own migration ([20260517000001_rls_policies.sql](supabase/migrations/20260517000001_rls_policies.sql)). Search uses the `search_listings()` Postgres function (FTS + price + geo).

### Media upload flow
Photos are uploaded directly browser → R2, never through our server:
1. Client compresses to WebP (max 1600px, q=0.82) via Canvas — see [lib/upload.ts](apps/web/src/lib/upload.ts).
2. Client POSTs [/api/upload-url](apps/web/src/app/api/upload-url/route.ts) to mint a presigned PUT (5-min TTL, S3 SDK against R2 endpoint, see [lib/r2.ts](apps/web/src/lib/r2.ts)).
3. Client PUTs the blob to R2 directly (XHR for progress).
4. Client POSTs [/api/listings/[id]/media](apps/web/src/app/api/listings/[id]/media/route.ts) to register the row.

Don't proxy uploads through Next.js routes — it defeats the purpose of presigned URLs and breaks the cost model.

### Server Actions vs Route Handlers
Form submissions (login, sell, chat send) are Next.js **Server Actions** colocated as `actions.ts` next to the page. Async fetches from the client (upload URL minting, media register, save-listing toggle) are **Route Handlers** under [app/api/](apps/web/src/app/api/). Stick to this split — don't migrate form mutations to API routes or vice versa without reason.

### Env vars and the SetupScreen pattern
All env access goes through [apps/web/src/lib/env.ts](apps/web/src/lib/env.ts). Missing values return `''` rather than throwing at import time. Code that *needs* a value should check `isConfigured` / `isStorageConfigured` and either render a setup hint (UI path) or throw (`getClient()` in r2.ts). Don't sprinkle `process.env.X!` non-null assertions through the codebase.

## Things to keep in mind

- The mobile app's screens are skeletons. If a task says "implement on mobile," confirm scope first — most current work is web-only.
- `apps/web/.eslintrc.json` extends Next defaults; no custom rules to memorize.
- There's no Husky / lint-staged. CI ([.github/workflows/web-ci.yml](.github/workflows/web-ci.yml)) runs lint + type-check + tests.
- Razorpay, Resend, Sentry, Surepass integrations are not yet wired — env vars exist but no code paths call them. Adding any of these is a real feature, not a stub.
