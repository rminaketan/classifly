# Classifly.in

India's next-generation marketplace for buy, sell, jobs, and services.

> **New here?** Read `SETUP.md` to go from `git clone` to a running app in under 60 minutes.

## Project Structure

```
classifly/
├── apps/
│   ├── web/                   # Next.js 14 app (web + API routes)
│   └── mobile/                # Flutter app (iOS + Android)
├── packages/
│   ├── db/                    # @classifly/db — generated Supabase types
│   ├── shared/                # @classifly/shared — Zod schemas + utils
│   └── ui/                    # @classifly/ui — design tokens (TS export)
├── supabase/
│   ├── config.toml            # Local Supabase config
│   └── migrations/            # SQL migrations (initial schema, RLS, seed)
├── .github/workflows/         # CI: web, mobile, db migrate, security
├── docs/
│   ├── 01-architecture/       # Architecture docs (enterprise + lean tracks + CI/CD)
│   ├── 02-database/           # Schema spec, ERD, RLS, storage, migration playbook
│   └── 03-ui-wireframes/      # Interactive HTML prototype + design tokens
├── package.json               # Monorepo root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── SETUP.md                   # Account provisioning + run guide
└── .env.example
```

## Two-Track Plan

We have two architecture tracks, used at different stages of the company. **The code in this repo implements the lean track.**

| Track | When | Monthly infra | Doc |
|---|---|---|---|
| **Lean Bootstrap** (active) | 0 → 500 K MAU | **~₹0** | `docs/01-architecture/Lean_Bootstrap_Architecture.md` |
| **Enterprise** (target endgame) | 500 K → 50 M+ MAU | ₹16 L → ₹2.5 Cr | `docs/01-architecture/Classifly_Architecture_Phase1.md` |

Every component in the lean stack has a documented one-week migration path to its enterprise equivalent.

## Tech Stack (lean / current)

- **Web:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn-style tokens
- **Mobile:** Flutter 3.24+ (iOS, Android)
- **Backend:** Next.js route handlers + Supabase (Postgres + Auth + Realtime + Storage)
- **Object storage + CDN:** Cloudflare R2 (free, no egress fees) + Cloudflare CDN
- **Cache + queues:** Upstash Redis + QStash (free tiers)
- **Payments:** Razorpay (2% per transaction, no monthly fee)
- **SMS OTP:** MSG91 (pay-per-message)
- **Monitoring:** Sentry + Axiom + Better Stack (all free tiers)
- **CI/CD:** GitHub Actions → Cloudflare Pages

## Quickstart

```bash
# 1. Install
pnpm install

# 2. Boot local Supabase (Postgres + Auth on your laptop)
pnpm db:start
pnpm db:reset    # applies migrations + dev seed

# 3. Copy env template
cp .env.example .env.local
# Then paste in the local Supabase URL + keys printed by db:start

# 4. Run the web app
pnpm dev         # http://localhost:3000

# 5. (optional) Run the mobile app
cd apps/mobile
flutter create . --platforms=android,ios --org in.classifly
flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
```

See `SETUP.md` for the full account-provisioning guide (Cloudflare, Razorpay, MSG91, etc.).

## Status

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Enterprise architecture & product blueprint | Done — `docs/01-architecture/Classifly_Architecture_Phase1.md` |
| 1a | Lean bootstrap architecture | Done — `docs/01-architecture/Lean_Bootstrap_Architecture.md` |
| 1b | CI/CD pipeline (enterprise) | Done — `docs/01-architecture/CI_CD_Pipeline.md` |
| 1c | CI/CD pipeline (lean) | Done — `docs/01-architecture/CI_CD_Pipeline_Lean.md` |
| 2  | Database schema + ERD | Done — `docs/02-database/` |
| 3  | Web + mobile UI wireframes | Done — `docs/03-ui-wireframes/` |
| 4  | **Scaffold: monorepo + migrations + web + Flutter + CI** | **Done — this repo** |
| 5  | Photo upload UX on listing detail | Next |
| 6  | Chat (Supabase Realtime) | Next |
| 7  | Saved listings + saved searches | Next |
| 8  | KYC tier 1 (PAN check via Surepass) | Pending (M2) |
| 9  | Featured-listing payment (Razorpay) | Pending (M1) |

## Useful commands

```bash
pnpm dev               # web only
pnpm build             # all packages
pnpm lint              # all
pnpm type-check        # all
pnpm format            # prettier
pnpm db:start          # local Supabase
pnpm db:reset          # rebuild local DB
pnpm db:diff           # see schema drift vs migrations
pnpm db:push           # push migrations to linked remote
pnpm db:types          # regenerate packages/db/src/types.ts
pnpm mobile:dev        # cd apps/mobile && flutter run
```

## License

Proprietary. © 2026 Classifly.in.
