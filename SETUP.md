# Classifly.in — Local Setup Guide

This guide takes you from a fresh clone to a running app in **under 60 minutes**, including signing up accounts for every external service. Everything here uses free tiers — there is no recurring cost in Year 1.

---

## 0. Prerequisites

Install on your machine if you don't have them:

| Tool | Version | Install |
|---|---|---|
| Node.js | 20.10+ | https://nodejs.org or `nvm install 20` |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Docker Desktop | latest | https://docker.com — required by Supabase CLI |
| Supabase CLI | latest | `brew install supabase/tap/supabase` or `scoop install supabase` |
| Flutter | 3.24+ | https://flutter.dev (mobile only) |
| Git | any recent | https://git-scm.com |

---

## 1. Clone and install

```bash
git clone https://github.com/yourname/classifly.git
cd classifly
pnpm install
cp .env.example .env.local
```

`.env.local` is git-ignored — never commit it.

---

## 2. Run Supabase locally (fastest path to a working app)

This route gives you a Postgres + Auth + Storage stack on your laptop. **No internet account required.**

```bash
pnpm db:start          # boots local Supabase via Docker
pnpm db:reset          # applies migrations + dev seed
```

When `db:start` finishes, it prints credentials for your local stack:

```
API URL:        http://localhost:54321
Studio URL:     http://localhost:54323
DB URL:         postgresql://postgres:postgres@localhost:54322/postgres
anon key:       eyJh...   (long)
service_role:   eyJh...   (longer; treat as secret)
```

Paste these into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon key from above>
SUPABASE_SERVICE_ROLE_KEY=<the service_role key from above>
```

Then:

```bash
pnpm dev
```

Open **http://localhost:3000** — the home page should show "No listings yet in your area" with the categories grid.

**Sign up flow:** click **Sign in**, enter `+919999000001`, click Send OTP. The OTP is delivered to **InBucket** (Supabase's local SMS sink) at **http://localhost:54324** — copy it from there and paste into the verify screen. You're now signed in.

Now click **SELL** to post your first ad and watch it appear on the home page.

That's the end of the minimum-to-run path. Everything below is for going live.

---

## 3. Create cloud Supabase project (for production)

1. Go to https://supabase.com → **New project**. Region: **Mumbai (ap-south-1)**. Pricing: **Free**.
2. After ~2 minutes the project is provisioned. Copy from **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL` (for prod env in Cloudflare Pages)
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never expose to the browser)
3. From **Settings → Database**, copy the DB password and project ref for CI:
   - `PROD_SUPABASE_REF` (the `xxxxxxx.supabase.co` prefix)
   - `PROD_SUPABASE_DB_PASSWORD`
4. Push migrations to the cloud:
   ```bash
   supabase login
   supabase link --project-ref <your-ref>
   pnpm db:push
   ```
5. In **Authentication → Providers**, enable **Phone**. Wire it to MSG91 (see §5) when you have an account; until then, OTPs go to Supabase's free SMS provider which is rate-limited to ~30/hour.

---

## 4. Cloudflare account (Pages, R2, DNS)

1. Sign up at https://cloudflare.com (free).
2. **Add site** `classifly.in` (you'll need to buy the domain first — see §11).
3. **R2 → Create bucket**: `classifly-media-prod` (public) and `classifly-private-prod` (private). Repeat with `-dev` suffix for dev project.
4. **R2 → Manage R2 API Tokens → Create API Token** with `Object Read & Write` permission. Save:
   - `CF_R2_ACCOUNT_ID` (visible in any R2 page URL)
   - `R2_ACCESS_KEY` and `R2_SECRET_KEY`
5. **R2 → Settings → Public access**: connect `media.classifly.in` subdomain to `classifly-media-prod` (one click).
6. **Workers & Pages → Create application → Pages → Connect to Git**, pick your repo. Set build:
   - Framework preset: **Next.js**
   - Build command: `pnpm install && pnpm --filter web build`
   - Build output directory: `apps/web/.next`
   - Env vars: paste all values from your `.env.local` *except* development-only ones
7. Project secret token: **My Profile → API Tokens → Create Token → Edit Cloudflare Pages**. Save as `CF_API_TOKEN` and your `CF_ACCOUNT_ID` (visible in any Pages URL) into GitHub secrets.

---

## 5. MSG91 (production SMS OTP)

1. Sign up at https://msg91.com (free trial; pay-as-you-go after).
2. Complete DLT registration (mandatory in India). Create an OTP template — Classifly's recommended template:
   `Your Classifly OTP is {{otp}}. Valid for 5 minutes. Do not share. — CLSFLY`
3. From dashboard, copy:
   - `MSG91_AUTH_KEY`
   - `MSG91_SENDER_ID` (e.g. `CLSFLY`)
   - `MSG91_OTP_TEMPLATE_ID`
4. In Supabase dashboard → **Authentication → Providers → Phone**, choose MSG91 and paste these values.

Cost: roughly **₹0.15 per OTP**. For 10K sign-ups that's ₹1,500 — see the lean cost breakdown in `docs/01-architecture/Lean_Bootstrap_Architecture.md`.

---

## 6. Razorpay (payments)

1. Sign up at https://razorpay.com. Choose **Standard Checkout**.
2. Switch to **Test mode** (top-right toggle) — you get test cards/UPI immediately.
3. **Settings → API Keys → Generate Test Key**. Save:
   - `RAZORPAY_KEY_ID` (starts with `rzp_test_`)
   - `RAZORPAY_KEY_SECRET`
4. Live keys require KYC: PAN, bank account, GSTIN. Plan ~3–7 days.

No monthly fee. Take rate: **2% on each successful transaction**.

---

## 7. Resend (email)

1. Sign up at https://resend.com (3 K emails/month free).
2. Add and verify `classifly.in` (DNS records via Cloudflare).
3. Copy `RESEND_API_KEY` from the dashboard.

---

## 8. Surepass / IDfy (KYC) — defer until M2

We don't need KYC verification until users start paying. Skip this for now. When you're ready:
1. https://surepass.io — PAN verification at **₹2/call**, Aadhaar e-KYC at **₹4/call**.
2. Add `SUREPASS_API_TOKEN` to env.

---

## 9. Upstash Redis (rate limiting + cache)

1. Sign up at https://upstash.com.
2. **Create database** → Region: **AP-South** (Mumbai). Tier: **Free** (10K commands/day).
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 10. Sentry / Axiom / Better Stack (monitoring) — defer if you want

All have generous free tiers. Sign up at:
- https://sentry.io → 5K events/month free → copy `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN`.
- https://axiom.co → 500 GB/month free → copy `AXIOM_DATASET` and `AXIOM_TOKEN`.
- https://betterstack.com → 10 monitors free → set up an HTTP monitor against `https://classifly.in/api/health`.

---

## 11. Domain

Buy `classifly.in` from any registrar (₹600–₹1,000/year). NameCheap, Hostinger, BigRock, GoDaddy all work. Point nameservers at Cloudflare (Cloudflare → your site → DNS → "Update nameservers"). DNS propagation takes 10 min to 24 h.

---

## 12. GitHub secrets

Once you have all the values above, go to your GitHub repo → **Settings → Secrets and variables → Actions** and add:

| Secret | Value source |
|---|---|
| `CF_API_TOKEN` | §4 step 7 |
| `CF_ACCOUNT_ID` | §4 step 7 |
| `SUPABASE_ACCESS_TOKEN` | `supabase login` → `~/.supabase/access-token` |
| `DEV_SUPABASE_REF` | dev project ref |
| `DEV_SUPABASE_DB_PASSWORD` | dev project DB password |
| `DEV_SUPABASE_DB_URL` | dev `postgresql://...` connection string |
| `PROD_SUPABASE_REF` | prod project ref |
| `PROD_SUPABASE_DB_PASSWORD` | prod project DB password |
| `PROD_SUPABASE_DB_URL` | prod connection string |
| `PROD_SUPABASE_URL` | prod public URL |
| `PROD_SUPABASE_ANON_KEY` | prod anon key |
| `SNYK_TOKEN` | https://snyk.io account settings |
| `SENTRY_AUTH_TOKEN` | sentry org → User settings → Auth Tokens |

Also create a **GitHub Environment** named `production` under **Settings → Environments**. Add yourself as a required reviewer. This makes prod deploys gated on a manual click.

---

## 13. Verify end-to-end

```bash
# Type-check everything
pnpm type-check

# Lint
pnpm lint

# Run web app
pnpm dev
# → http://localhost:3000 should show the home feed

# Run mobile app
cd apps/mobile
flutter create . --platforms=android,ios --org in.classifly
flutter run --dart-define=SUPABASE_URL=$LOCAL_SUPABASE_URL --dart-define=SUPABASE_ANON_KEY=$LOCAL_SUPABASE_ANON_KEY
```

If all green, you're ready to push your first PR. The web CI runs lint + tests + Cloudflare preview deploy. Merging to `main` triggers a prod deploy (gated by your approval).

---

## Troubleshooting

**`pnpm db:start` hangs forever** — Docker isn't running. Open Docker Desktop, wait for it to be healthy, retry.

**Web app shows the SetupScreen even though I set env vars** — restart `pnpm dev`. Next.js only reads `.env.local` at boot.

**OTP doesn't arrive in InBucket** — check the inbox at http://localhost:54324 → "Monitor". The phone number must be in E.164 form (`+91XXXXXXXXXX`, no spaces).

**RLS blocks a query** — open Supabase Studio at http://localhost:54323 → Authentication → impersonate your user, then re-run the query in the SQL editor. The error message will tell you which policy denied access. Cross-reference with `docs/02-database/rls_policies.sql`.

**`flutter create . --platforms=android,ios` fails** — make sure `flutter doctor` shows no red. Most commonly missing: Android command-line tools or Xcode + CocoaPods.

**Cloudflare Pages build fails** — the most common cause is missing env vars. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Pages project settings before the build.

---

## What you have when this is done

- A monorepo with web (Next.js) + mobile (Flutter) + shared packages.
- A live Supabase project with all 30 tables, RLS, FTS, geo, triggers, and helper functions.
- Cloudflare Pages auto-deploying every PR + production on merge.
- A CI pipeline running lint, type-check, tests, security scans, and DB migrations.
- A working app at `https://classifly.in` where users can sign up with phone OTP, browse listings, post their own.

Total monthly cost so far: **₹0** (you only pay ~₹0.15 per OTP and 2% of any transactions).

Refer back to `docs/01-architecture/Lean_Bootstrap_Architecture.md` for the revenue-gated milestones at which each next-tier service gets enabled.
