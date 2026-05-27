# Classifly.in — Project Manifest

Snapshot of every file in this project, with size in bytes. Generated 2026-05-20.

**Total:** 114 files, 569 KB (uncompressed source, no `node_modules` / `build` / `.next`).

## File tree

```
classifly/                                                     1.0 KB
├── README.md                                                  4.6 KB
├── SETUP.md                                                  10.4 KB
├── PROJECT_MANIFEST.md                                       (this file)
├── package.json                                               1.0 KB
├── pnpm-workspace.yaml                                          40 B
├── tsconfig.base.json                                           662 B
├── .env.example                                               1.7 KB
├── .gitignore                                                   905 B
├── .editorconfig                                                299 B
├── .nvmrc                                                         8 B
├── .prettierrc                                                  152 B
├── .prettierignore                                              103 B
│
├── .github/
│   └── workflows/
│       ├── api-migrate.yml                                    2.1 KB
│       ├── mobile-ci.yml                                      1.2 KB
│       ├── security-scan.yml                                  1.3 KB
│       ├── web-ci.yml                                         1.5 KB
│       └── web-deploy-prod.yml                                1.9 KB
│
├── apps/
│   ├── mobile/                                       (Flutter skeleton)
│   │   ├── README.md                                          2.0 KB
│   │   ├── analysis_options.yaml                                279 B
│   │   ├── pubspec.yaml                                       1.0 KB
│   │   └── lib/
│   │       ├── main.dart                                      1.2 KB
│   │       ├── router.dart                                      931 B
│   │       ├── theme.dart                                     3.3 KB
│   │       ├── screens/
│   │       │   ├── home_screen.dart                           4.0 KB
│   │       │   ├── listing_detail_screen.dart                   386 B
│   │       │   ├── login_screen.dart                          3.1 KB
│   │       │   ├── profile_screen.dart                          739 B
│   │       │   ├── search_screen.dart                           731 B
│   │       │   └── sell_screen.dart                             701 B
│   │       └── widgets/
│   │           └── bottom_nav.dart                            1.5 KB
│   │
│   └── web/                                          (Next.js 14 app)
│       ├── README.md                                          1.7 KB
│       ├── .eslintrc.json                                       101 B
│       ├── next-env.d.ts                                         81 B
│       ├── next.config.mjs                                      621 B
│       ├── package.json                                         991 B
│       ├── postcss.config.js                                     83 B
│       ├── tailwind.config.ts                                   369 B
│       ├── tsconfig.json                                        466 B
│       └── src/
│           ├── middleware.ts                                    479 B
│           ├── app/
│           │   ├── globals.css                                1.7 KB
│           │   ├── layout.tsx                                 1.2 KB
│           │   ├── error.tsx                                    688 B
│           │   ├── not-found.tsx                                502 B
│           │   ├── page.tsx                            (home feed) 4.9 KB
│           │   ├── (auth)/
│           │   │   ├── login/
│           │   │   │   ├── page.tsx                           1.3 KB
│           │   │   │   ├── LoginForm.tsx                      2.2 KB
│           │   │   │   └── actions.ts                         1.1 KB
│           │   │   └── verify/
│           │   │       ├── page.tsx                           1.3 KB
│           │   │       └── VerifyForm.tsx                     2.7 KB
│           │   ├── auth/callback/route.ts                       720 B
│           │   ├── search/page.tsx                            4.7 KB
│           │   ├── listings/[id]/
│           │   │   ├── page.tsx                              10.8 KB
│           │   │   └── not-found.tsx                            606 B
│           │   ├── sell/
│           │   │   ├── page.tsx                               1.3 KB
│           │   │   ├── PostAdForm.tsx                         6.7 KB
│           │   │   └── actions.ts                             2.0 KB
│           │   ├── profile/
│           │   │   ├── page.tsx                               4.3 KB
│           │   │   └── saved/page.tsx                         3.8 KB
│           │   ├── chat/
│           │   │   ├── page.tsx                               5.4 KB
│           │   │   ├── actions.ts                             4.4 KB
│           │   │   └── [id]/
│           │   │       ├── page.tsx                           5.8 KB
│           │   │       └── ChatThread.tsx                     7.0 KB
│           │   └── api/
│           │       ├── health/route.ts                          368 B
│           │       ├── upload-url/route.ts                    3.5 KB
│           │       ├── saved-listings/route.ts                2.2 KB
│           │       └── listings/[id]/media/route.ts           5.0 KB
│           ├── components/
│           │   ├── Header.tsx                                 2.1 KB
│           │   ├── ListingCard.tsx                            2.0 KB
│           │   ├── PhotoUploader.tsx                          9.2 KB
│           │   ├── SaveButton.tsx                             2.6 KB
│           │   └── SetupScreen.tsx                            2.4 KB
│           └── lib/
│               ├── auth.ts                                    1.1 KB
│               ├── env.ts                                     1.6 KB
│               ├── r2.ts                                      2.9 KB
│               ├── saved.ts                                     715 B
│               ├── upload.ts                                  4.9 KB
│               └── supabase/
│                   ├── client.ts                                387 B
│                   ├── server.ts                              1.5 KB
│                   └── middleware.ts                          1.2 KB
│
├── packages/
│   ├── db/
│   │   ├── README.md                                            619 B
│   │   ├── package.json                                         383 B
│   │   ├── tsconfig.json                                        146 B
│   │   └── src/
│   │       ├── index.ts                                         818 B
│   │       └── types.ts                                       7.5 KB
│   ├── shared/
│   │   ├── package.json                                         286 B
│   │   ├── tsconfig.json                                        146 B
│   │   └── src/
│   │       ├── index.ts                                          82 B
│   │       ├── constants.ts                                   2.4 KB
│   │       ├── format.ts                                      2.2 KB
│   │       └── schemas.ts                                     4.0 KB
│   └── ui/
│       ├── package.json                                         236 B
│       ├── tsconfig.json                                        146 B
│       └── src/
│           ├── index.ts                                          48 B
│           └── tokens.ts                                      1.8 KB
│
├── supabase/
│   ├── README.md                                              1.5 KB
│   ├── config.toml                                            1.6 KB
│   ├── seed.sql                                                 150 B
│   └── migrations/
│       ├── 20260517000000_initial_schema.sql                 34.6 KB
│       ├── 20260517000001_rls_policies.sql                   11.1 KB
│       └── 20260517000002_dev_seed.sql                       13.6 KB
│
└── docs/
    ├── 01-architecture/
    │   ├── Classifly_Architecture_Phase1.md                  29.4 KB
    │   ├── Lean_Bootstrap_Architecture.md                    19.8 KB
    │   ├── CI_CD_Pipeline.md                                 22.4 KB
    │   └── CI_CD_Pipeline_Lean.md                            17.7 KB
    ├── 02-database/
    │   ├── README.md                                          5.4 KB
    │   ├── ERD.md                                             7.3 KB
    │   ├── schema.sql                                        39.6 KB
    │   ├── rls_policies.sql                                  13.4 KB
    │   ├── seed.sql                                          15.8 KB
    │   ├── storage.md                                         6.0 KB
    │   └── migration_notes.md                                 7.8 KB
    └── 03-ui-wireframes/
        ├── README.md                                          5.8 KB
        ├── design-tokens.json                                 4.8 KB
        ├── screen-inventory.md                               12.9 KB
        └── prototype.html                                   106.2 KB
```

## What each top-level folder is for

| Folder | Purpose |
|---|---|
| `apps/web/` | Next.js 14 app — production source. App Router, Supabase auth, listings, sell, search, profile, chat (Realtime), saved, photo upload. |
| `apps/mobile/` | Flutter skeleton — theme, go_router, bottom nav, 6 placeholder screens. Run `flutter create . --platforms=android,ios --org in.classifly` to materialise platform folders. |
| `packages/db/` | TypeScript types for the Supabase schema. Regenerate via `pnpm db:types`. |
| `packages/shared/` | Zod schemas + Indian-locale helpers (formatINR, timeAgo, phone mask). |
| `packages/ui/` | Design tokens consumed by Tailwind (web) and Flutter (mobile). |
| `supabase/` | Database config + 3 forward-only migrations (schema, RLS, dev seed). |
| `docs/01-architecture/` | The 4 long-form design docs (2 architecture tracks + 2 CI/CD plans). |
| `docs/02-database/` | Database spec — ERD, schema (mirror of `supabase/migrations/`), storage layout, migration policy. |
| `docs/03-ui-wireframes/` | Interactive HTML prototype + design tokens + screen inventory. |
| `.github/workflows/` | 5 CI workflows. |

## Features shipped

1. Phone-OTP authentication via Supabase Auth.
2. Listing creation flow (`/sell`) — server action validates against the Zod schema and inserts into Postgres with proper RLS.
3. Home feed (`/`) — ISR with realtime saved-state per viewer.
4. Search (`/search`) — uses the `search_listings()` Postgres function with FTS + price filter.
5. Listing detail (`/listings/[id]`) — gallery, attributes, description, seller card.
6. **Photo upload** — Canvas compression → R2 presigned PUT → register endpoint. Seller-only view.
7. **Chat** — Supabase Realtime subscription, optimistic send, dedup, mark-read, listing context.
8. **Saved listings** — bookmark toggle on every card; dedicated `/profile/saved` page.
9. Profile (`/profile`) — listing management with Boost CTA.

## Pending (next milestones)

- Razorpay featured-listing checkout (revenue starts here).
- Reviews after a sale.
- KYC tier 1 (Surepass PAN check).
- Saved-search alerts.
- Mobile feature parity (Flutter screens are skeletons today).
- The `listings.save_count` denorm trigger (currently soft).
