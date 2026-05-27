# Classifly.in — Lean Bootstrap Architecture (Year 1, ~₹0 Infra)

This is the **default plan** for Classifly.in. It replaces the enterprise-scale stack in `Classifly_Architecture_Phase1.md` as the starting point. The enterprise document remains valid as the **endgame** we grow into — but only once revenue justifies it.

The goal of this document: **keep recurring infra cost under ₹500/month for the first year**, while still shipping a credible marketplace that can compete with OLX and Quikr on user experience, and that we can scale up *piece by piece* as revenue arrives.

---

## 1. Philosophy

| Principle | What it means in practice |
|---|---|
| **Free tier first, paid tier only when it pays for itself** | Every component uses a free SaaS tier or a free self-host (Oracle Cloud Always Free, Cloudflare). We only move to a paid tier when revenue from that vertical exceeds the next-tier cost. |
| **Modular monolith, not microservices** | One Next.js app does web + API. Flutter app calls the same API. Twenty microservices come later — when we have twenty engineers. |
| **Use Postgres for everything you can** | Postgres replaces Elasticsearch, Redis, Kafka, and ClickHouse for Year 1. Full-text search, queues, pub/sub, analytics — all in one database. |
| **Cloudflare as the spine** | Cloudflare's free tier gives us global CDN, R2 object storage (10GB free, *no egress fees*), Workers, DNS, email forwarding, Pages. This alone saves ₹50K+/month vs AWS. |
| **Design for migration, not for purity** | Pick boring tools (Postgres, S3 API, OCI containers) that have an exit ramp to the enterprise stack later. Avoid vendor lock-in we can't escape. |
| **Revenue triggers infra upgrades, not engineering aspiration** | We have explicit revenue milestones that unlock each next tier. No premature scaling. |

---

## 2. Year-1 Stack at a Glance

| Layer | Lean choice | Cost | Free-tier ceiling |
|---|---|---|---|
| Web frontend | **Next.js 14** on **Cloudflare Pages** (or Vercel Hobby) | ₹0 | Unlimited bandwidth on Cloudflare Pages; 100 GB/mo on Vercel |
| Mobile app | **Flutter 3.x** | ₹0 (₹2K one-time Apple dev account = ₹8K, Play Console = ₹2K) | n/a |
| Backend API | Same Next.js app (App Router route handlers) + a small **Hono** worker for cron/queues | ₹0 | 100K req/day on Cloudflare Workers free |
| Database | **Supabase** (Postgres + Auth + Realtime + Storage) free tier | ₹0 | 500 MB DB, 50K MAU, 1 GB storage, 2 GB egress, 2 M Edge Function invocations |
| Search | **Postgres full-text search** (`tsvector`, `pg_trgm`); upgrade to **Meilisearch** on Oracle Cloud Always Free when needed | ₹0 | Built into Postgres |
| Cache + queues | **Upstash Redis** free + **QStash** free | ₹0 | 10K Redis commands/day, 500 QStash messages/day |
| Object storage | **Cloudflare R2** (S3-compatible, **no egress fees**) | ₹0 | 10 GB storage, 1M Class-A ops/mo, 10M Class-B ops/mo |
| CDN + image resize | **Cloudflare** (free plan + Image Resizing on Pro at ₹1700/mo when needed) | ₹0 | Unlimited bandwidth |
| Auth | **Supabase Auth** (phone OTP, email, OAuth) | ₹0 | 50K MAU |
| Email transactional | **Resend** | ₹0 | 3 K/mo, 100/day |
| SMS OTP (India) | **MSG91** pay-as-you-go (~₹0.15/SMS) | ~₹500–₹2 K/mo at MVP scale | n/a |
| WhatsApp notifications | **Gupshup** or skip; rely on push + SMS | ₹0 (skip Year 1) | n/a |
| Push notifications | **FCM** + **APNs** | ₹0 | unlimited |
| Maps / geocoding | **MapTiler** free + **OpenStreetMap Nominatim** (self-host on Oracle free tier if rate limits bite) | ₹0 | 100K map loads/mo |
| Payments | **Razorpay** (no monthly fee; per-txn 2%) | ₹0 fixed | per-txn only |
| KYC | **Surepass** or **IDfy** pay-as-you-go (PAN ₹2, Aadhaar verify ₹4) | ₹0 fixed | per-verification only |
| Image/text moderation | **Cloudflare AI** (free tier for Workers AI) + manual queue | ₹0 | 10K neuron-seconds/day |
| Monitoring | **Sentry** + **Better Stack** + **Axiom** all free tiers | ₹0 | 5K Sentry events/mo, 10 monitors, 500 GB logs/mo |
| CI/CD | **GitHub Actions** + **Cloudflare Pages** built-in | ₹0 | 2K Actions min/mo private; Pages builds free |
| Container hosting (overflow) | **Oracle Cloud Always Free** (4 ARM Ampere vCPU + 24 GB RAM forever!) | ₹0 | The single most valuable freebie on the internet |
| Domain | `classifly.in` | ₹800/year | n/a |
| Domain email | **Cloudflare Email Routing** + forward to Gmail | ₹0 | unlimited |

### Total fixed Year-1 cost: **₹800 (domain) + ₹2 K Play Console + ₹8 K Apple dev = ~₹11 K one-time, ₹0/month recurring**

Variable cost (only when used): SMS OTPs (₹0.15 each), KYC checks (₹2–4 each), Razorpay take-rate (2% of GMV — only when a customer pays for something). All of these are **revenue-correlated**, not fixed.

---

## 3. Architecture (Lean Version)

```
                    ┌─────────────────────────────────────────┐
                    │           Cloudflare (free)             │
                    │   DNS · CDN · WAF · Email Routing       │
                    └────────────────┬────────────────────────┘
                                     │
                  ┌──────────────────┼─────────────────┐
                  │                  │                 │
        ┌─────────▼────────┐  ┌──────▼──────┐  ┌───────▼─────────┐
        │  Cloudflare      │  │  Cloudflare │  │  Flutter app    │
        │  Pages           │  │  R2 buckets │  │  (iOS/Android)  │
        │  (Next.js web)   │  │  images/    │  │  FCM push       │
        └─────────┬────────┘  └─────────────┘  └────────┬────────┘
                  │                                     │
                  │  REST / tRPC / GraphQL              │
                  └──────────────┬──────────────────────┘
                                 │
                  ┌──────────────▼──────────────────┐
                  │   Next.js API routes            │
                  │   (Cloudflare Pages Functions   │
                  │    or Vercel Serverless)        │
                  │   - listings CRUD               │
                  │   - search                      │
                  │   - chat REST + polling         │
                  │   - jobs, services CRUD         │
                  │   - payments webhook            │
                  └─────┬───────────────┬───────────┘
                        │               │
              ┌─────────▼───────┐  ┌────▼──────────┐
              │   Supabase      │  │  Upstash      │
              │   Postgres +    │  │  Redis +      │
              │   Auth +        │  │  QStash       │
              │   Realtime +    │  │  (queues)     │
              │   Storage(small)│  └───────────────┘
              └─────────┬───────┘
                        │
                        │  (overflow / heavy jobs only)
                        ▼
              ┌─────────────────────┐
              │  Oracle Cloud       │
              │  Always Free        │
              │  4 ARM vCPU, 24 GB  │
              │   - Meilisearch     │
              │   - Worker queues   │
              │   - Nominatim       │
              │   - cron runners    │
              └─────────────────────┘
```

### Why this is still a credible marketplace

- **Postgres full-text search with `pg_trgm` + `tsvector`** handles tens of thousands of listings with sub-100 ms queries when properly indexed. We add Meilisearch only when listings exceed ~100K.
- **Supabase Realtime** (which is just Postgres logical replication exposed as WebSockets) gives us real-time chat updates without running our own WebSocket fleet.
- **Cloudflare R2 + on-the-fly resize via Cloudflare Images or a tiny Worker** removes the image-pipeline pain that historically eats marketplace budgets.
- **Razorpay Standard Checkout** is a 100-line integration with zero monthly fee.

---

## 4. What We Defer Until Revenue Arrives

The original Phase 1 doc lists every feature. Here is what we **build now** vs **defer**.

### Build now (in the free-tier monolith)

- Listing CRUD with images
- Categories: 5 to start (mobiles, vehicles, furniture, real estate, jobs)
- Postgres FTS-based search with filters and geo radius
- Chat (REST + Supabase Realtime; no WebSocket fleet)
- Phone OTP via Supabase Auth + MSG91
- Phone masking via simple proxy numbers (Exotel pay-as-you-go) — or skip; show in-app chat only
- Hindi + English UI
- Featured-listing purchase (Razorpay)
- Basic moderation: report-and-takedown queue, image hashing for known scams
- Push notifications via FCM
- Web (Next.js) + Flutter mobile

### Defer until revenue triggers

| Feature | Build when… | Why deferred |
|---|---|---|
| Microservices split | Team > 12 engineers | One repo = one deploy = far less ops overhead |
| Elasticsearch / OpenSearch | Listings > 100 K | Postgres FTS is genuinely good enough below that |
| Citus sharding | DB > 100 GB or > 1000 QPS write | Single Postgres handles enormous load |
| Kafka | Real-time event volume > 500 K/day | QStash + Postgres triggers cover early needs |
| ClickHouse | Need sub-second analytics on > 100 M rows | Supabase Postgres + materialized views serve dashboards |
| Voice CV for jobs | After we have 1 K employer signups | Build for paying customers first |
| Visual / voice search | After 100 K MAU | Premium feature, not table-stakes |
| Escrow service | After 5 paying disputes/month | Razorpay Route adds it later in a week |
| All 11 vernacular languages | After validation in Hindi + English | Translation is cheap to add incrementally |
| Multi-region DR | After ₹50 L/month revenue | Supabase Pro adds replicas; free tier doesn't need it |
| Kubernetes + ArgoCD + Istio | Multiple services + > 3 SRE | Pure overhead on a monolith |
| OpenTelemetry + Grafana Cloud | Free Sentry/Axiom exhausted | Free tiers are very generous |

---

## 5. Revenue-Gated Scaling Milestones

Each milestone unlocks the next layer of spend. The numbers assume Indian INR pricing as of mid-2026.

| Milestone | MAU | Monthly revenue | New monthly infra cost | What gets upgraded |
|---|---|---|---|---|
| **M0 — Launch** | 0 → 5 K | ₹0 | **₹0** | All free tiers. Domain only fixed cost. |
| **M1 — Traction** | 5 K → 25 K | ₹5 K (first featured listings) | **₹0–₹500** | Maybe add Cloudflare Pro (₹1700) for image resizing. Otherwise nothing changes. |
| **M2 — Growth** | 25 K → 100 K | ₹50 K | **₹2–5 K** | Supabase Pro ($25 ≈ ₹2100): 8 GB DB, 100 GB egress, daily backups. Razorpay take-rate scales naturally. |
| **M3 — Scale-out** | 100 K → 500 K | ₹3 L | **₹15–25 K** | Move search to Meilisearch on Oracle Free (still ₹0) → if outgrown, dedicated VPS at Hetzner (₹800/mo). Add CDN paid tier. Add Sentry team plan. Bigger Supabase compute. |
| **M4 — Multi-vertical revenue** | 500 K → 2 M | ₹15 L | **₹1–2 L** | Migrate to AWS / dedicated cluster: managed Postgres (RDS), real Redis cluster, dedicated app servers. Start splitting the monolith. |
| **M5 — Pan-India scale** | 2 M → 10 M | ₹50 L+ | **₹5–10 L** | The enterprise architecture in `Classifly_Architecture_Phase1.md` becomes the live system. EKS, Citus, Elasticsearch, Kafka — the works. |

**Key rule:** infra cost should never exceed **10% of monthly revenue**. If it does, freeze upgrades and optimise.

---

## 6. India-Specific Concerns on the Lean Stack

| Concern | Lean approach |
|---|---|
| Vernacular | Start English + Hindi only. Add Bengali, Tamil, Telugu, Marathi when each crosses 10K MAU. Strings in JSON files in the repo. |
| UPI payments | Razorpay Standard Checkout. No escrow until paid disputes justify it. |
| KYC | Tier 0 (phone OTP only) for everyone Year 1. Add PAN check (Surepass ₹2/call) gated on first paid feature usage. Aadhaar e-KYC deferred to M3. |
| Performance for low-end Android | Flutter app already small; aim for < 10 MB APK. Cold start < 3s on mid-tier devices. Server uses Cloudflare global edge so India latency is < 100ms. |
| Connectivity | Aggressive image compression at upload (WebP, 1080px max); R2 + Cloudflare resize on the fly. |
| Compliance | DPDP-ready from day one: consent ledger as a Postgres table (cheap), data-export endpoint, account-delete endpoint. |
| Fraud | Phone-number rate limit (Supabase row-level security + simple counter), image-hash blocklist, manual moderation queue for first 6 months. ML fraud scoring deferred to M3. |

---

## 7. Honest Tradeoffs vs the Enterprise Plan

| What we give up | When it bites |
|---|---|
| Sub-50 ms p95 latency in chat | Above ~500 concurrent users on a single Supabase Realtime channel |
| Multi-region DR | Day Cloudflare or Supabase has a multi-hour outage. Mitigation: nightly DB dump to R2. |
| Microservices independence | When the team exceeds 12 engineers; before then, the monolith is a *feature*. |
| Real-time analytics dashboards | Until M3. Workarounds: a daily materialised view + a hand-rolled admin page. |
| Custom Kubernetes flexibility | Trivial cost: we never needed it at this stage. |
| Vendor independence | Cloudflare and Supabase are de facto SPOFs. Mitigation: nightly cross-provider backups (R2 → Backblaze B2; Supabase dump → Oracle volume). |
| Polished observability | Free Sentry + Axiom + Better Stack stitched together is functional but not slick. |

**What we keep:** clean domain modelling, Postgres as the source of truth, an exit ramp to every paid/managed equivalent, Flutter mobile, Next.js web. None of these decisions trap us.

---

## 8. Migration Ramps (so we don't have to rewrite later)

Every component has a documented "next-tier" replacement that requires *less than a week of work* to swap in. The boundary that matters is the **interface**, not the implementation.

| Component | Current | Next tier | Migration cost |
|---|---|---|---|
| Database | Supabase Postgres | AWS RDS Postgres | DNS swap + replication cutover; < 1 day |
| Object storage | Cloudflare R2 | AWS S3 | Both S3-API; change endpoint + creds |
| Search | Postgres FTS | Meilisearch → Elasticsearch | Hide behind `SearchClient` interface from day one |
| Cache | Upstash Redis | AWS ElastiCache | Both speak Redis protocol |
| Queue | QStash | SQS / Kafka | Hide behind `Queue` interface |
| Auth | Supabase Auth | Auth0 / Cognito / self-hosted Keycloak | OIDC compliance throughout |
| Web hosting | Cloudflare Pages | Vercel Pro → EKS | Next.js works on all three unchanged |
| API hosting | Pages Functions | Cloud Run → EKS | Hono / standard Node runtime |
| Email | Resend | AWS SES | Hide behind `Mailer` interface |
| SMS | MSG91 | AWS SNS | Hide behind `SmsSender` interface |
| Payments | Razorpay | Razorpay (stays) | No migration needed |

**The discipline:** every external dependency is behind a small interface in our codebase (e.g., `interface StorageClient { put, get, signedUrl }`). Swapping the provider is a one-file change.

---

## 9. Total Year-1 Cost Breakdown (Realistic)

| Item | Cost |
|---|---|
| Domain (`classifly.in`) | ₹800 |
| Apple Developer Program | ₹8 100 |
| Google Play Console (one-time) | ₹2 100 |
| SMS OTPs (assume 50 K signups @ ₹0.15) | ₹7 500 |
| KYC PAN checks (assume 5 K @ ₹2) | ₹10 000 |
| Razorpay fees (2% on assumed ₹5 L GMV) | ₹10 000 |
| Cloudflare Pro (only if image resizing needed in H2) | ₹0–20 000 |
| Supabase Pro upgrade (only if MAU > 50K mid-year) | ₹0–25 000 |
| Buffer for surprises | ₹15 000 |
| **Year 1 total — conservative** | **~₹50 K–₹1 L (about $600–$1 200)** |

For reference, the enterprise plan started at **₹2.7 L/month** (₹32 L/year) just for infrastructure.

**Savings: ~₹30 L in Year 1** — money that goes into marketing, content, and first hires instead.

---

## 10. Suggested First 90 Days

| Week | Goal |
|---|---|
| 1 | Buy domain. Set up Cloudflare, Supabase project, R2 bucket, Resend, MSG91 account. Create Next.js + Flutter skeleton repos. |
| 2 | Auth flow (Supabase Auth + phone OTP). Profile + KYC tier 0. CI in GitHub Actions. |
| 3 | Listings table + categories schema. Image upload to R2. Listing detail page. |
| 4 | Search (Postgres FTS). Home feed. Filters by category, price, location radius. |
| 5 | Chat (Supabase Realtime). Notification triggers. |
| 6 | Featured-listing purchase (Razorpay). Admin dashboard for moderation. |
| 7 | Flutter app: shells for the same flows. |
| 8 | Polish, performance pass, low-data mode in Flutter. |
| 9 | Closed beta with 100 friends-and-family in Bangalore. |
| 10 | Iterate on feedback. Add jobs vertical (read-only first). |
| 11 | Add services vertical (read-only first). |
| 12 | Public soft launch in Bangalore. First marketing experiment. |

Hardware-wise: a single developer with a laptop can run this entire stack locally with `npx supabase start` + Flutter emulators. No cloud spend until production launch.

---

## 11. When to Re-Read the Enterprise Document

The original `Classifly_Architecture_Phase1.md` becomes your reference when you cross **₹15 L/month in revenue or 500 K MAU**, whichever comes first. At that point:

1. Re-read sections 4 (tech stack) and 5 (system architecture) of the enterprise doc.
2. Identify which microservice to split out first (usually `payment-service` or `search-service`).
3. Strangler-fig pattern: route specific endpoints to the new service while the monolith continues serving the rest.
4. Gradually migrate, one bounded context at a time. Budget 3–6 months for the full transition.

Until then, **stay lean**. Every rupee saved on infra is a rupee that buys customer acquisition.

---

## 12. Open Decisions

1. **Cloudflare Pages vs Vercel Hobby** for the Next.js app — Cloudflare wins on bandwidth limits (unlimited vs 100 GB) and R2 egress (free); Vercel wins on Next.js feature parity (ISR, edge middleware are more mature). **Recommendation: Cloudflare Pages.**
2. **Phone masking now or later?** Exotel pay-as-you-go is ₹0.30/minute. If we skip masking and force in-app chat only, we save complexity but risk users moving to WhatsApp. **Recommendation: in-app chat only for Year 1; add masking at M2.**
3. **Native KYC at signup vs gated to first paid action?** Gated is cheaper (KYC only for paying users) but slightly higher fraud. **Recommendation: gated.**
4. **Should we publish on Play Store from Day 1 or wait?** Play has a min-rating effect — early bad ratings stick. **Recommendation: open beta on Firebase App Distribution for 6 weeks, then Play.**

When you confirm direction, I'll regenerate the CI/CD doc for this lean stack (much simpler — basically GitHub Actions → Cloudflare Pages + Supabase migrations), and we can proceed to Phase 2 (database schema) sized for the lean Postgres-only design.
