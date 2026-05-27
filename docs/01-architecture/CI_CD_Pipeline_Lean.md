# Classifly.in — CI/CD Pipeline (Lean Version)

Companion to `Lean_Bootstrap_Architecture.md`. This is the **default pipeline** for Year 1.

If you're on the enterprise track, use `CI_CD_Pipeline.md` instead.

---

## 1. Goals

- **₹0/month** delivery infrastructure.
- One developer can push code → live in production in **under 5 minutes**.
- Same workflow for web, API, and mobile.
- All gates that protect quality (tests, security scans, type-check) still run on every PR.
- Easy to upgrade to the enterprise pipeline later without rewriting.

---

## 2. Tooling

| Concern | Tool | Cost |
|---|---|---|
| Source control | **GitHub** (private repos free for individuals/small teams) | ₹0 |
| CI | **GitHub Actions** free tier (2 000 min/mo) | ₹0 |
| Web hosting + auto-deploy | **Cloudflare Pages** (built-in CI on git push) | ₹0 |
| API hosting | Cloudflare Pages Functions (Next.js API routes deploy with the app) | ₹0 |
| DB migrations | **Supabase CLI** (`supabase db push`) | ₹0 |
| Mobile builds | GitHub Actions + **Fastlane** + **Firebase App Distribution** | ₹0 |
| Container registry (if needed for Oracle Cloud workloads) | **GitHub Container Registry** | ₹0 (public) / 500 MB free private |
| Secret management | GitHub Encrypted Secrets + Cloudflare env vars + Supabase Vault | ₹0 |
| Error tracking | **Sentry** free tier (5 K events/mo, 1 project) | ₹0 |
| Logs | **Axiom** free tier (500 GB/mo) | ₹0 |
| Uptime | **Better Stack** free tier (10 monitors) | ₹0 |
| Status page | Better Stack free status page | ₹0 |
| **Total** | | **₹0/month** |

---

## 3. Branching Model

Trunk-based with **two long-lived branches** and per-feature short-lived branches.

```
main      ← production (auto-deploys to classifly.in)
develop   ← preview environment (auto-deploys to dev.classifly.in)
feature/* ← short-lived branches off develop; PR back to develop
hotfix/*  ← off main; PR to main + cherry-pick to develop
```

**Why two environments and not three?** Year 1, we don't need dev/qa/staging — preview deploys per PR give us validation without dedicated environments.

### Per-PR preview URLs
Cloudflare Pages auto-creates a preview URL for every PR (e.g., `pr-42.classifly-web.pages.dev`). Reviewers can click and test the live change before merging.

---

## 4. Environments

| Env | URL | Database | Triggered by | Approval |
|---|---|---|---|---|
| Preview | `pr-{n}.classifly-web.pages.dev` | shared `dev` Supabase project | Every PR | none |
| Develop | `dev.classifly.in` | `dev` Supabase project | Push to `develop` | none |
| Production | `classifly.in` | `prod` Supabase project | Push to `main` | 1 manual click in GitHub Actions |

Two Supabase projects (both free tier — one for dev, one for prod). Cloudflare Pages deploys both web apps from the same repo with different environment variables.

---

## 5. Monorepo Layout

```
classifly/
├── .github/workflows/
│   ├── web-ci.yml              ← lint, type-check, test, build (every PR)
│   ├── web-deploy-prod.yml     ← deploy main → prod (manual approval)
│   ├── api-migrate.yml         ← run Supabase migrations
│   ├── mobile-ci.yml           ← Flutter analyze + test (every PR)
│   ├── mobile-beta.yml         ← Fastlane → Firebase App Dist (on develop merge)
│   ├── mobile-release.yml      ← Fastlane → Play/TestFlight (on mobile-v* tag)
│   └── security-scan.yml       ← weekly Snyk + Trivy + GitLeaks
├── apps/
│   ├── web/                    ← Next.js (web + API routes)
│   ├── mobile/                 ← Flutter
│   └── workers/                ← Hono workers for cron + queue handlers
├── packages/
│   ├── db/                     ← Supabase migrations + types
│   ├── shared/                 ← shared TS types (zod schemas, API contracts)
│   └── ui/                     ← shared design tokens (web + mobile)
├── docs/
└── supabase/                   ← supabase CLI config + seed data
```

**Why a monorepo?** Single PR can change schema + API + web + mobile, all reviewed and deployed together. Saves *enormous* coordination overhead at this stage.

---

## 6. The Web + API Pipeline

### 6.1 On every PR (`.github/workflows/web-ci.yml`)

```yaml
name: web-ci
on:
  pull_request:
    paths: ['apps/web/**', 'packages/**']

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web lint
      - run: pnpm --filter web type-check
      - run: pnpm --filter web test
      - run: pnpm --filter web build

      - name: Cloudflare Pages preview
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: classifly-web
          directory: apps/web/.next
```

Cloudflare Pages posts the preview URL back to the PR as a check.

### 6.2 On push to `develop`

Cloudflare Pages auto-builds and deploys to `dev.classifly.in`. No GitHub Actions step needed — the git push *is* the deploy trigger.

### 6.3 On push to `main` (production)

```yaml
name: web-deploy-prod
on:
  push:
    branches: [main]
    paths: ['apps/web/**', 'packages/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production    # GitHub env with required reviewers
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web build
      - name: Deploy to prod
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: classifly-web-prod
          branch: main
          directory: apps/web/.next
      - name: Notify Sentry of release
        uses: getsentry/action-release@v1
        with:
          environment: production
          version: ${{ github.sha }}
```

The `environment: production` clause makes GitHub require a manual approval click. Anyone on the "approvers" list can click; that's the only gate. Deploy takes ~2 minutes.

---

## 7. Database Migrations (Supabase)

Migrations are SQL files in `supabase/migrations/`, named `YYYYMMDDHHMMSS_description.sql`.

**Local development:**
```bash
supabase migration new add_listings_table
# edit the generated SQL file
supabase db reset                 # rebuild local DB and apply
supabase test db                  # run pgTAP tests
```

**On merge to `develop`** (`.github/workflows/api-migrate.yml`):

```yaml
name: api-migrate-dev
on:
  push:
    branches: [develop]
    paths: ['supabase/migrations/**']

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase link --project-ref ${{ secrets.SUPABASE_DEV_REF }}
      - run: supabase db push --include-roles
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DEV_DB_PWD }}
```

**On push to `main`:** same workflow targeting prod project, with `environment: production` gate.

**Rules:**
- Migrations are forward-only and additive (add column nullable → backfill → make non-null in next migration).
- A destructive change (drop column, drop table) requires three ladder-step migrations across three releases.
- A full `pg_dump` snapshot runs before every prod migration and is uploaded to R2 (`s3://classifly-backups/db/{git-sha}.sql.gz`).
- The migration job fails if it would take an exclusive lock for > 5 seconds (we use `lock_timeout`).

---

## 8. Mobile Pipeline (Flutter)

### 8.1 On every PR (`.github/workflows/mobile-ci.yml`)

```yaml
name: mobile-ci
on:
  pull_request:
    paths: ['apps/mobile/**']

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { channel: stable, cache: true }
      - working-directory: apps/mobile
        run: |
          flutter pub get
          dart format --set-exit-if-changed lib test
          flutter analyze
          flutter test --coverage
          flutter build apk --debug

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { channel: stable, cache: true }
      - working-directory: apps/mobile
        run: |
          flutter pub get
          flutter build ios --no-codesign --debug
```

(GitHub Actions provides 2 000 free min/mo on Linux, 200 free min/mo on macOS. iOS build runs only on PRs that touch `apps/mobile/ios/`.)

### 8.2 On merge to `develop` — beta build

```yaml
name: mobile-beta
on:
  push:
    branches: [develop]
    paths: ['apps/mobile/**']

jobs:
  beta:
    runs-on: macos-latest          # macOS so we can build iOS too
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - uses: ruby/setup-ruby@v1
        with: { bundler-cache: true, working-directory: apps/mobile }
      - working-directory: apps/mobile
        env:
          FIREBASE_APP_ID_ANDROID: ${{ secrets.FB_APP_ID_ANDROID }}
          FIREBASE_APP_ID_IOS: ${{ secrets.FB_APP_ID_IOS }}
          FIREBASE_CLI_TOKEN: ${{ secrets.FB_CLI_TOKEN }}
        run: |
          bundle exec fastlane android beta
          bundle exec fastlane ios beta
```

`Fastfile`:

```ruby
default_platform(:android)

platform :android do
  lane :beta do
    sh("flutter", "build", "appbundle", "--release", "--flavor", "beta")
    firebase_app_distribution(
      app: ENV["FIREBASE_APP_ID_ANDROID"],
      android_artifact_type: "AAB",
      android_artifact_path: "../build/app/outputs/bundle/betaRelease/app-beta-release.aab",
      groups: "internal-testers"
    )
  end
end

platform :ios do
  lane :beta do
    sh("flutter", "build", "ipa", "--release", "--flavor", "beta", "--export-options-plist", "ios/exportOptions.plist")
    firebase_app_distribution(
      app: ENV["FIREBASE_APP_ID_IOS"],
      ipa_path: "../build/ios/ipa/Classifly.ipa",
      groups: "internal-testers"
    )
  end
end
```

### 8.3 On tag `mobile-vX.Y.Z` — store release

Same Fastlane lanes, but uploading to:
- **Google Play Internal Testing** track
- **Apple TestFlight**

Manual promotion to phased prod rollout (10% → 50% → 100% over 7 days) is done via the Play Console and App Store Connect UIs. Crash-free-sessions ≥ 99.5% required at each phase (monitored via Sentry).

---

## 9. Workers (Cron + Queue Handlers)

The few things we can't do inside Next.js API routes — scheduled jobs, async fanout, image moderation — run as **Cloudflare Workers** (Hono framework, deployed via Wrangler).

```yaml
name: workers-deploy
on:
  push:
    branches: [main]
    paths: ['apps/workers/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          workingDirectory: apps/workers
          command: deploy --env production
```

Schedules are declared in `wrangler.toml` and execute on Cloudflare's free 1-trigger-per-minute cron tier.

---

## 10. Security & Quality Gates

| Gate | Tool | Runs | Blocks merge? |
|---|---|---|---|
| Lint | ESLint / Spotless / `dart analyze` | Every PR | Yes |
| Type-check | `tsc --noEmit` | Every PR | Yes |
| Unit tests | Vitest (web) / `flutter test` (mobile) | Every PR | Yes |
| Build | `next build` / `flutter build` | Every PR | Yes |
| Secret scan | **GitLeaks** (GitHub Action) | Every PR | Yes |
| Dependency scan | **Snyk** free tier | Weekly + on PR if package.json changes | Yes for HIGH/CRITICAL |
| Code scanning | **GitHub CodeQL** (free for public, available on private with limits) | Weekly | Notification only |
| SQL migration safety | Custom lint: rejects `DROP`, `ALTER … NOT NULL` without default, exclusive locks | Every PR with migration | Yes |
| Pre-deploy DB snapshot | `pg_dump` to R2 | Before every prod migration | n/a |

`.github/workflows/security-scan.yml`:

```yaml
name: security-scan
on:
  schedule: [{ cron: '0 2 * * 1' }]   # Mondays 02:00 UTC
  pull_request:
    paths: ['**/package.json', '**/pubspec.yaml', '**/Cargo.toml']

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }

  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
```

---

## 11. Secrets Layout

| Secret | Lives in | Used by |
|---|---|---|
| `CF_API_TOKEN`, `CF_ACCOUNT_ID` | GitHub repo secrets | All Cloudflare-touching workflows |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_*_DB_PWD` | GitHub repo secrets | Migration workflows |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Cloudflare Pages env vars | Next.js runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare Pages env vars (encrypted) | Next.js API routes only |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Cloudflare Pages env vars | API routes |
| `MSG91_AUTH_KEY` | Cloudflare Pages env vars | SMS sender route |
| `SURE_PASS_TOKEN` | Cloudflare Pages env vars | KYC routes |
| `SENTRY_DSN`, `AXIOM_TOKEN` | Public env vars | Web + mobile |
| Apple cert + Play upload key | GitHub repo secrets (base64-encoded) | Mobile release workflows |

**Rotation cadence:** SMS / KYC / Razorpay keys every 180 days; signing keys every 90 days; Apple cert when it expires. Calendar reminders in Notion.

---

## 12. Monitoring & Alerts (Free Tier)

- **Sentry**: errors from web + mobile; project-level alert if error rate > 1% over 5 min.
- **Axiom**: structured logs from Cloudflare Pages Functions (auto-forwarded via Logpush, which is on Cloudflare's Workers Free if under 1 GB/day) plus mobile (Sentry forwarder).
- **Better Stack**: 10 HTTP monitors pinging `/api/health` from Mumbai, Bangalore, Singapore every 1 min; alerts to email + Slack webhook.
- **Supabase dashboard**: built-in DB metrics (connections, slow queries, storage).
- **Cloudflare Analytics**: free per-domain traffic and edge metrics.
- **Status page**: Better Stack hosts a free public page at `status.classifly.in`.

Total: **₹0/month**.

When you exhaust Sentry's 5K events/mo (usually around 25K MAU), upgrade to Sentry Team ($26/mo) — that's an M2 expense.

---

## 13. Rollback

| Failure | Action | Wall time |
|---|---|---|
| Bad web/API deploy | Cloudflare Pages "Rollback to previous deployment" button | 30 s |
| Bad mobile release | Halt Play / TestFlight rollout from store consoles | 5 min to halt; affected users stay on prior version |
| Bad migration | Restore from the pre-deploy snapshot stored in R2 | 5–15 min depending on DB size |
| Bad worker deploy | `wrangler rollback` to previous version id | 30 s |
| Bad config (env var) | Edit in Cloudflare Pages env vars; next request picks it up | < 1 min |

There is no canary at this stage — the user base is small enough that "deploy + watch Sentry" is a reasonable strategy. We add canary when we cross M3 (₹3 L/month revenue).

---

## 14. Cost Comparison

| Pipeline | Year-1 cost |
|---|---|
| Enterprise (`CI_CD_Pipeline.md`) | ~₹5.5 L/month |
| **Lean (this doc)** | **~₹0/month** |
| Annual savings | **~₹65 L** |

The savings here are even larger than on application infra. CI/CD cost dominates because every minute of build time, every container scan, every line of log matters.

---

## 15. Upgrade Path

When revenue justifies the upgrade, this is the order to move:

1. **At M2** (₹50 K/mo revenue): Sentry Team ($26/mo). Still no infrastructure changes.
2. **At M3** (₹3 L/mo revenue): Add a `staging` Supabase project for pre-prod validation. Wire it into the workflow between develop and main.
3. **At M3.5**: Move to Vercel Pro for Next.js (better ISR, edge middleware) if Cloudflare Pages becomes limiting. Adds ~$20/mo.
4. **At M4** (₹15 L/mo revenue): Stand up the enterprise EKS pipeline alongside this one, strangler-fig style. New services land on EKS; legacy stays on Cloudflare Pages until rewritten.
5. **At M5**: The enterprise CI/CD pipeline is live and this lean pipeline is retired or kept for low-criticality services.

Each step is opt-in based on revenue — never on engineering preference.

---

## 16. First-Week Setup Checklist

- [ ] Create GitHub repo `classifly/classifly` (private).
- [ ] Create two Supabase projects: `classifly-dev`, `classifly-prod`.
- [ ] Create two Cloudflare Pages projects pointing at the repo, with `develop` → dev domain, `main` → prod domain.
- [ ] Buy `classifly.in` and `dev.classifly.in` subdomain, point both at Cloudflare.
- [ ] Create Cloudflare R2 bucket `classifly-media-prod` + `classifly-media-dev`.
- [ ] Create Upstash Redis (one DB, suffices for dev + prod with key prefixing).
- [ ] Create Sentry project, Axiom dataset, Better Stack workspace.
- [ ] Generate Apple Distribution cert + Play upload key; store in GitHub repo secrets.
- [ ] Set up Firebase project for FCM + App Distribution.
- [ ] Commit `.github/workflows/` scaffolding from this doc.
- [ ] Run `supabase init` and commit baseline schema (see Phase 2 docs).
- [ ] Push first PR, verify preview URL appears, merge to `develop`, verify dev deploy.

**Time-to-first-deploy from a clean slate: roughly 1 working day.**
