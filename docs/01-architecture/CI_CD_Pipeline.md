# Classifly.in — CI/CD Pipeline for QA and PROD on AWS

Companion to `Classifly_Architecture_Phase1.md`. Defines the end-to-end delivery pipeline for every artifact in the system, the environments, the promotion model, and the AWS services that back it.

---

## 1. Guiding Principles

1. **One source of truth for code, one source of truth for environments.** App repos hold code; a separate GitOps repo holds environment manifests. Deployments are pull requests against the GitOps repo.
2. **Build once, promote everywhere.** A single immutable artifact (container image, mobile binary, web bundle) is promoted across `dev → qa → staging → prod`. We never rebuild for an environment.
3. **Trunk-based development.** Short-lived feature branches, merged behind feature flags. Mainline is always releasable.
4. **Progressive delivery.** Every prod release is a canary by default — auto-promoted if SLOs hold, auto-rolled-back otherwise.
5. **Security in the pipeline, not as a gate at the end.** SAST, SCA, container scan, IaC scan, and secret scan run on every PR.
6. **Everything reproducible.** No "click in AWS console" deployments. All infra is Terraform; all k8s state is Helm + ArgoCD.

---

## 2. Tooling at a Glance

| Concern | Tool | Notes |
|---|---|---|
| Source control | **GitHub Enterprise Cloud** | PR reviews, branch protection, CODEOWNERS |
| CI | **GitHub Actions** (self-hosted runners on EKS via ARC) | Self-hosted for speed + private network access |
| CD (k8s) | **ArgoCD** + Argo Rollouts | GitOps + canary/blue-green |
| Container registry | **Amazon ECR** (per region, immutable tags) | Vulnerability scanning enabled |
| Static + binary registry | **AWS S3** + **CodeArtifact** | Web bundles, Maven/npm caches |
| IaC | **Terraform** + **Terragrunt** | State in S3 + DynamoDB lock |
| K8s package | **Helm 3** | Charts in each app repo + shared library chart |
| DB migrations | **Flyway** (Java) / **node-pg-migrate** (Node) | Runs as a k8s Job before app rollout |
| Mobile CI | **GitHub Actions** + **Fastlane** + **Firebase App Distribution** | Beta builds; Play/App Store for prod |
| Secrets | **AWS Secrets Manager** + **External Secrets Operator** | Vault for dynamic DB creds |
| Security scans | Semgrep, Snyk, Trivy, Checkov, GitLeaks | All in PR + nightly |
| Feature flags | **Unleash** (self-hosted) | Or LaunchDarkly if budget permits |
| Observability hook | OTEL + Datadog (or Grafana Cloud) | Deploy markers, SLO tracking, error-budget alerts |

---

## 3. Branching and Release Model

```
main (always green, always deployable)
  ├── feature/* (short-lived, ≤ 3 days)
  ├── hotfix/* (urgent, cherry-pick to release)
  └── release/* (only for mobile semver tags)
```

- **PRs to `main`** require: 1 reviewer (2 for `payment-service`, `identity-service`, `fraud-service`), all CI checks green, no secret scan failures, signed commits (DCO).
- **Auto-merge** enabled when checks pass — merge queue serialises landings.
- **Tags** are SemVer for shared libraries and mobile; **commit-sha** is the version for backend services and web.
- **Hotfix flow** uses a `hotfix/*` branch off the prod-tagged commit, cherry-picked to `main`. Same canary rules apply.

---

## 4. Environments

| Env | Purpose | AWS Account | Cluster | Data | Traffic | Cost cap |
|---|---|---|---|---|---|---|
| `local` | Engineer laptop | n/a | k3d / Docker Compose | seeded fixtures | none | n/a |
| `dev` | Free-for-all integration; auto-deploy on merge | `classifly-dev` | EKS `dev` (1 AZ, spot) | small RDS, single ES node | none | ₹1.5 L/mo |
| `qa` | QA + automation; auto-deploy on merge with manual gate | `classifly-qa` | EKS `qa` (2 AZ) | RDS mirror of prod schema, anonymized data subset | none (synthetic) | ₹3 L/mo |
| `staging` | Pre-prod; prod-mirror config; release validation; load tests | `classifly-staging` | EKS `staging` (3 AZ, prod-shape) | RDS scaled-down replica of prod | shadow traffic from prod (10%) | ₹6 L/mo |
| `perf` | On-demand load testing | shared with staging | dedicated namespace | dedicated DB clone | k6 / Locust generators | spin up only when needed |
| `prod` | Customer-facing | `classifly-prod` | EKS `prod` (multi-AZ, ap-south-1; DR in ap-south-2) | Citus + read replicas | real users | scales with traffic |

**AWS Organizations** with one account per environment + a `classifly-shared` account for the registry, GitOps repo, and Vault. SCPs prevent cross-env access; IAM Identity Center (formerly SSO) governs human access.

---

## 5. CI Pipelines by Artifact Type

### 5.1 Java Microservices (Spring Boot)

`.github/workflows/service-ci.yml` runs on every PR and on push to `main`.

**Stages**
1. Checkout + cache (Gradle + Docker layer cache via BuildKit).
2. **Lint + format** — Spotless, Checkstyle.
3. **Build** — `./gradlew build -x test`.
4. **Unit tests** — `./gradlew test` (parallel by module).
5. **Integration tests** — Testcontainers spin up Postgres, Redis, Kafka, ES; runs `./gradlew integrationTest`.
6. **Coverage gate** — JaCoCo, fails if below 75% for changed files.
7. **Security scans** (parallel):
   - **Semgrep** SAST with Java rule pack.
   - **Snyk** SCA on dependencies.
   - **GitLeaks** secret scan.
8. **Build OCI image** — Jib (rootless, reproducible).
9. **Trivy** container scan — fails on `HIGH/CRITICAL` CVEs unless `risk-accepted` label is on the PR.
10. **SBOM** generated (CycloneDX) and stored alongside the image.
11. **Push to ECR** — image tagged `${git_sha}` and `${branch}-latest`.
12. **Sign image** — `cosign` keyless via OIDC; signature pushed to ECR.
13. **Update GitOps repo** — on `main` only, bot opens PR in `classifly/gitops` updating `dev/values.yaml` with the new image tag.

Total target wall time: **< 10 minutes** for an average service.

### 5.2 Node.js Services (BFF, chat, notifications)

Same shape as Java; substitutions:
- pnpm with frozen lockfile, monorepo via Nx or Turborepo.
- ESLint, Prettier, TSC strict.
- Vitest unit + Playwright contract tests against BFF.
- Docker multi-stage build (distroless final).
- Same Trivy + Snyk + Semgrep + Cosign chain.

### 5.3 Next.js Web

Two artifacts produced from the same build:
1. **Container** for the Node server (SSR + ISR + API routes) — deployed to EKS.
2. **Static bundle** (`.next/static`, `public/*`) — uploaded to S3, served behind CloudFront.

**Stages**
1. pnpm install (frozen).
2. Type-check (`tsc --noEmit`), lint, Prettier.
3. Unit (Vitest) + component (React Testing Library) + visual regression (Chromatic) tests.
4. **Lighthouse CI** budget gate (perf > 85, a11y > 95).
5. `next build` with build-time env from `qa.env`/`prod.env`.
6. Build container, push to ECR.
7. Sync static assets to `s3://classifly-web-static-${env}/${git_sha}/`; CloudFront origin path updated on rollout.
8. **Visual regression** comparison against prod baseline; flaky-diff threshold 0.1%.
9. Bot opens GitOps PR.

### 5.4 Flutter Mobile

**Per PR**
- `flutter analyze`, `dart format --set-exit-if-changed`.
- Unit + widget tests; golden tests for top 20 screens.
- Build debug APK + iOS simulator binary as artifacts.

**On merge to `main`**
- Build release Android App Bundle (`.aab`) and iOS `.ipa`.
- Sign with Play upload key / App Store distribution cert (stored in GitHub Secrets, rotated quarterly).
- **Fastlane** uploads to **Firebase App Distribution** (internal testers).
- Symbol files (Proguard mapping, dSYM) uploaded to Crashlytics.

**On release tag (`mobile-v1.4.0`)**
- Same build + sign.
- Fastlane promotes to **Google Play Internal Testing** and **TestFlight**.
- Manual approval to promote to closed beta → open beta → phased prod rollout (10% → 50% → 100% over 7 days).
- Crash-free-sessions SLO must be ≥ 99.5% at each phase or rollout auto-pauses.

### 5.5 Python ML Services (recommendation, fraud, pricing)

- Poetry + uv for deps.
- Ruff, mypy, pytest with coverage.
- Model training is a **separate pipeline** (SageMaker Pipelines): retrains weekly, registers to **SageMaker Model Registry**, manual approval gate, then serving image rebuilds with the new model id baked in.
- Same Trivy + Snyk + cosign chain.

### 5.6 Infrastructure as Code (Terraform)

- Stored in `classifly/infra` repo; one root module per environment.
- PR opens → **`terraform plan`** runs via Atlantis (in the shared account) and posts the diff as a PR comment.
- **Checkov** + **tfsec** + **Terrascan** policy checks; PRs must pass or carry a documented exception.
- Merge to `main` → `terraform apply` runs against `dev` automatically; `qa`, `staging`, `prod` require a manual approval in Atlantis from someone in the `platform` team.

---

## 6. CD Pipeline: GitOps with ArgoCD

```
GitHub App repo  ─▶  CI builds image  ─▶  Bot PR to GitOps repo (image tag bump)
                                                    │
                                                    ▼
                                         PR auto-merged (dev) or
                                         manually approved (qa+)
                                                    │
                                                    ▼
                                ArgoCD detects change in GitOps repo
                                                    │
                                                    ▼
                          Argo Rollouts performs the deployment:
                            ▸ dev  → recreate
                            ▸ qa   → rolling
                            ▸ stg  → blue/green with shadow traffic
                            ▸ prod → canary: 1% → 5% → 25% → 50% → 100%
                                     pause + auto-analysis at each step
```

### 6.1 GitOps Repo Layout

```
classifly-gitops/
├── apps/
│   ├── identity-service/
│   │   ├── base/values.yaml              ← chart values shared
│   │   ├── dev/values.yaml               ← env overrides
│   │   ├── qa/values.yaml
│   │   ├── staging/values.yaml
│   │   └── prod/values.yaml
│   ├── listing-service/...
│   └── ...
├── platform/
│   ├── ingress-nginx/
│   ├── istio/
│   ├── external-secrets/
│   ├── argocd/
│   ├── prometheus/
│   ├── unleash/
│   └── ...
└── argocd/
    └── applicationsets/                  ← one ApplicationSet per env
```

### 6.2 Argo Rollouts Analysis (prod canary)

At each canary step, Argo Rollouts queries Prometheus for:
- **Error rate** of the canary pods must be ≤ 1.5× baseline.
- **p95 latency** must be ≤ 1.3× baseline.
- **5xx rate** must be ≤ 0.5%.
- Plus business metric: for `listing-service`, the listing-create success rate must be within 2pp of baseline.

If any metric breaches for two consecutive 60-second windows, the rollout is auto-aborted and traffic returns to the previous ReplicaSet within ~10 seconds.

### 6.3 Promotion Flow (concrete example)

A typical change to `listing-service`:

| Time | Step | Actor |
|---|---|---|
| T+0 | PR merged to `main` | engineer |
| T+8m | CI green; image `listing-service:abc123` in ECR | bot |
| T+9m | GitOps PR opened bumping `dev/values.yaml` | bot |
| T+9m | PR auto-merged | bot |
| T+10m | ArgoCD reconciles; pod rolled in `dev` | ArgoCD |
| T+15m | Smoke + contract tests pass in `dev` | CI |
| T+15m | Bot opens GitOps PR for `qa` | bot |
| T+? | QA team manually merges after testing | human |
| later | Similar PRs cascade: `qa → staging → prod` with required approvers | human + bot |
| prod | Argo Rollouts canary, ~25 min total | ArgoCD |

For **low-risk services** (e.g., `media-service` thumbnails), `qa → staging → prod` is fully automated with no human gate — purely SLO-driven.

For **high-risk services** (`payment-service`, `identity-service`, `fraud-service`), promotion to prod requires:
- Sign-off from the service owner.
- A scheduled deploy window (Mon–Thu, 10:00–17:00 IST) unless tagged `hotfix`.
- A documented rollback plan in the PR description.

---

## 7. Database Migrations

- **Flyway** (Java services) and **node-pg-migrate** (Node services) store migrations in each app repo under `db/migrations/`.
- Migrations are **forward-only**, additive, and **zero-downtime-friendly**: add column nullable → backfill → make non-null in a later release.
- A k8s **pre-deploy Job** runs the migration; the app rollout only starts if the Job succeeds.
- For Citus shards, schema changes use `run_command_on_workers()` wrapped by Flyway callbacks.
- **Destructive changes** (drop column, drop table) require a three-step release ladder:
  1. Code stops reading the column.
  2. Code stops writing the column.
  3. Migration drops the column.
- A **schema snapshot** is taken before every prod migration and stored to S3 for fast rollback.

---

## 8. Secrets Management

- **AWS Secrets Manager** is the source of truth for application secrets (DB passwords, API keys, JWT signing keys).
- **External Secrets Operator** running in EKS syncs Secrets Manager → k8s `Secret` resources on a 60-second interval.
- **Vault** issues dynamic Postgres credentials for human DB access (60-minute TTL); no human ever sees a long-lived DB password.
- **KMS-encrypted** at rest; access is via IAM Roles for Service Accounts (IRSA) — no IAM users with static keys anywhere.
- Rotation cadence: signing keys 90 days, third-party API keys 180 days, KMS CMKs annually.
- GitHub Secrets are limited to bootstrap items (cosign key, ECR pull) and rotated via Terraform when stale.

---

## 9. Security Gates (run on every PR)

| Gate | Tool | Action on fail |
|---|---|---|
| Static analysis | Semgrep + language-native (Spotbugs, ESLint security) | Block merge |
| Dependency scan | Snyk (also runs nightly to catch new CVEs) | Block merge for HIGH/CRITICAL |
| Secret scan | GitLeaks | Block merge |
| Container scan | Trivy on built image | Block merge for HIGH/CRITICAL |
| SBOM generation | Syft → CycloneDX | Non-blocking; archived |
| IaC scan | Checkov + tfsec + Terrascan | Block merge for HIGH |
| License scan | FOSSA | Block merge for non-permissive licenses |
| Container signing | cosign keyless via OIDC | Required at admission |
| Admission control | Kyverno (or Gatekeeper) verifies image signatures and policies | Pod refused if unsigned |

**Quarterly:** external penetration test, third-party SOC 2 audit prep, DR drill (recover prod from backups into a fresh account).

---

## 10. Mobile Release Pipeline (end-to-end)

```
PR              → debug build, unit + widget tests, golden tests
Merge to main   → release build, sign, upload to Firebase App Distribution (internal)
Tag mobile-vX.Y.Z
                → Fastlane → Google Play Internal Testing + TestFlight
Manual approval → Closed beta (1K users)
SLO holds 24h   → Open beta (50K users)
SLO holds 48h   → Phased prod 10% → 50% → 100% across 7 days
                → Crash-free sessions ≥ 99.5% required at each phase
Symbols         → Auto-upload to Crashlytics; rolled mappings retained 90 days
```

Force-update enforcement: minimum-supported-version is served from a remote config; older clients are blocked at app open with a "please update" screen.

---

## 11. Observability Hooks

- Every deploy publishes a **deploy marker** to Datadog/Grafana so dashboards correlate metrics with releases.
- **SLO error budget** for each tier-0 service is exposed in Grafana; if a service has burned > 50% of its monthly budget, all non-hotfix deploys to that service are auto-paused until the budget recovers.
- **Synthetic checks** (Checkly or Datadog Synthetics) hit canary URLs from Mumbai, Bangalore, Delhi every 30 seconds during a rollout.
- **Argo Notifications** posts deploy state to Slack `#deploys-prod` and pages the on-call via PagerDuty on auto-abort.

---

## 12. Rollback Strategy

| Failure | Action | Wall time |
|---|---|---|
| Canary metric breach | Argo Rollouts auto-aborts; previous ReplicaSet restored | ~10 s |
| Bad migration discovered post-deploy | `kubectl rollout undo` to previous image; migration left in place if additive; restored from snapshot if destructive (rare) | 30 s app + 5–10 min DB |
| Bad config in ConfigMap | Revert the GitOps PR; ArgoCD reconciles | ~60 s |
| Bad infra change | Terraform revert PR; Atlantis applies | minutes |
| Region outage | DNS failover (Route 53 health checks) to read-only mode in `ap-south-2`; promote replica to primary | 5 min to read-only, 30 min to full write |
| Data corruption | PITR from Postgres WAL (RPO 5 min) | 30–60 min |

Game-day drills run quarterly: deliberate region failure, deliberate DB corruption, deliberate bad deploy — measure recovery time and update runbooks.

---

## 13. Sample GitHub Actions Workflow (Java service, abridged)

```yaml
name: service-ci
on:
  pull_request:
  push:
    branches: [main]

permissions:
  id-token: write     # for OIDC to AWS + cosign
  contents: read

jobs:
  build:
    runs-on: [self-hosted, eks]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - uses: gradle/actions/setup-gradle@v3

      - name: Lint + build + test
        run: ./gradlew spotlessCheck build test integrationTest jacocoTestCoverageVerification

      - name: Semgrep
        uses: returntocorp/semgrep-action@v1

      - name: Snyk
        uses: snyk/actions/gradle@master
        env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }

      - name: GitLeaks
        uses: gitleaks/gitleaks-action@v2

      - name: AWS OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ vars.SHARED_ACCT }}:role/gha-ecr-push
          aws-region: ap-south-1

      - name: Build + push image (Jib)
        run: ./gradlew jib -Dimage=${{ vars.ECR }}/listing-service:${{ github.sha }}

      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ vars.ECR }}/listing-service:${{ github.sha }}
          severity: HIGH,CRITICAL
          exit-code: 1

      - name: Cosign sign
        run: cosign sign --yes ${{ vars.ECR }}/listing-service:${{ github.sha }}

      - name: Open GitOps PR (dev only)
        if: github.ref == 'refs/heads/main'
        uses: ./.github/actions/bump-gitops
        with:
          service: listing-service
          env: dev
          tag: ${{ github.sha }}
```

---

## 14. AWS Service Inventory

| Layer | AWS Service |
|---|---|
| Compute | **EKS** (1.30+), **Fargate** for cron jobs, **Lambda** for glue (S3 → SQS triggers) |
| Containers | **ECR** (immutable, scan on push, replication across regions) |
| Storage | **S3** (web static, media, backups, GitOps audit, Terraform state) |
| Database | **RDS for PostgreSQL** (Multi-AZ) for non-sharded services; **self-managed Citus on EC2** for listings; **ElastiCache Redis** cluster; **MSK** for Kafka; **OpenSearch Serverless** for search |
| Networking | **VPC** (3 AZ), **Transit Gateway** across env accounts, **PrivateLink** to Secrets Manager + ECR |
| Edge | **CloudFront** + **WAF** + **Shield Advanced** for prod; **Route 53** with health-check failover |
| Secrets / IAM | **Secrets Manager**, **KMS**, **IAM Identity Center** (SSO), **IAM Roles for Service Accounts** |
| Observability | **CloudWatch** (logs collected by Loki via Vector), **Managed Grafana**, **Managed Prometheus**, **X-Ray** via OTEL |
| Pipelines | **GitHub Actions** (self-hosted ARC on EKS), **CodeArtifact** for private packages |
| Backup / DR | **AWS Backup** for RDS, S3 versioning + replication to ap-south-2 |
| Cost / Governance | **Cost Explorer + Compute Optimizer**, **Service Control Policies** on the Org, **AWS Config** rules |

---

## 15. Cost Indicator for the Pipeline Itself

These are *delivery-pipeline* costs only (excludes the application infra cost in the main architecture doc).

| Item | Year-1 estimate (₹/mo) |
|---|---|
| GitHub Enterprise Cloud (40 seats) | ₹0.8 L |
| Self-hosted GHA runners on EKS (5 × c6i.2xlarge spot) | ₹0.6 L |
| ECR storage + scans (200 GB, 1M scans) | ₹0.4 L |
| Snyk + Semgrep + FOSSA (team tier) | ₹1.0 L |
| Datadog (or Grafana Cloud Pro) | ₹2.5 L |
| ArgoCD + Argo Rollouts (self-hosted) | included in EKS |
| Secrets Manager + KMS | ₹0.2 L |
| Atlantis + tfsec + Checkov (self-hosted) | included in EKS |
| **Total** | **~₹5.5 L/mo (~$6.5K)** |

---

## 16. Suggested Build-Out Order

| Week | Milestone |
|---|---|
| 1 | AWS Org + accounts + Identity Center; baseline Terraform + Atlantis |
| 2 | EKS dev + qa clusters; ECR; ArgoCD bootstrap |
| 3 | GitHub Actions reusable workflows; service template (Java + Node + Next.js + Flutter) |
| 4 | First service through `dev → qa` end-to-end; secrets via External Secrets |
| 5 | Staging cluster; Argo Rollouts canary configured; Prometheus + Grafana |
| 6 | Prod cluster (single AZ to start); GitOps PR approvals enforced |
| 7 | DB migration framework; pre-deploy Jobs wired |
| 8 | Mobile pipeline (Fastlane + Firebase App Distribution + TestFlight) |
| 9 | Security gates (Trivy, Snyk, Semgrep, Checkov) all blocking |
| 10 | First game-day drill: bad deploy + auto-rollback rehearsal |
| 11 | Multi-AZ prod; ap-south-2 DR replica |
| 12 | First prod deploy of a customer-facing service through the full pipeline |

---

## 17. Open Decisions for You

1. **GitHub Enterprise Cloud vs Self-hosted GitHub Enterprise Server** — Cloud is recommended unless data-residency contracts force self-host.
2. **Datadog vs self-hosted Grafana Cloud** — Datadog is faster to set up but ~3× the cost at scale.
3. **Unleash (self-hosted) vs LaunchDarkly** — Unleash is free and adequate for Year 1; revisit at 30M MAU.
4. **Managed Citus (Azure) vs self-managed on EC2** — we recommend self-managed in `ap-south-1` for now; Azure Cosmos for Citus isn't available in India.
5. **Single GitOps repo vs per-team GitOps repos** — single repo is recommended until the team exceeds ~60 engineers.

When you're ready, I can produce a Terraform skeleton that bootstraps the multi-account AWS Org, the EKS clusters, ECR, and the ArgoCD install — that becomes the first commit in the `classifly-infra` repo.
