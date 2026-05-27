# apps/web — Classifly Next.js app

Single Next.js 14 app handling both the marketing site and the authenticated marketplace UI.

## Run locally

```bash
# From repo root
cp .env.example .env.local        # fill in values; see /SETUP.md
pnpm db:start                     # Supabase locally on :54321
pnpm db:reset                     # apply migrations + seed
pnpm install
pnpm dev                          # http://localhost:3000
```

OTPs from the local Supabase land in InBucket at http://localhost:54324 — there is no real SMS gateway in dev.

## Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # /login, /verify, /auth/callback
│   ├── (app)/              # signed-in marketplace pages
│   │   ├── search/
│   │   ├── sell/           # post-ad wizard
│   │   ├── listings/[id]/
│   │   └── profile/
│   ├── api/upload-url/     # presigned R2 URLs
│   ├── layout.tsx
│   ├── page.tsx            # home feed
│   ├── error.tsx
│   ├── not-found.tsx
│   └── globals.css
├── components/             # UI components (Header, ListingCard, etc.)
├── lib/
│   ├── supabase/           # browser, server, middleware clients
│   ├── r2.ts               # presigned URL minting
│   ├── env.ts              # validated env vars
│   └── format.ts           # re-exports from @classifly/shared
└── middleware.ts           # auth session refresh
```

## What works without setup

The app boots without env vars and shows a friendly "configure your `.env.local`" screen. Once Supabase is wired in, auth and listings work end-to-end.
