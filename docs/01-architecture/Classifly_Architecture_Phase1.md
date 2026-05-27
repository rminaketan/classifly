# Classifly.in

## India's Next-Generation Marketplace
### Buy. Sell. Hire. Get Hired. Find Services.

**Architecture & Product Blueprint — Phase 1 of 3**
Prepared for: Minaketan
Version 1.0 · May 2026

---

## Table of Contents

1. Executive Summary
2. Market Opportunity and Competitive Landscape
3. Product Vision and Feature Catalog
4. Technology Stack: Detailed Recommendation
5. High-Level System Architecture
6. Client Architecture (Web + Mobile)
7. India-Specific Engineering Concerns
8. Security and Trust
9. Scaling Strategy for 50M+ Users
10. Observability and DevOps
11. Indicative Infrastructure Cost
12. Twelve-Month Roadmap
13. Risks and Mitigations
14. What Phase 2 and Phase 3 Will Deliver

---

## 1. Executive Summary

Classifly.in is conceived as India's most comprehensive online classifieds and services marketplace, covering buy and sell of goods, job listings and applications, and local services. The platform is designed from day one to surpass incumbents OLX and Quikr on user experience, breadth of categories, trust and safety, vernacular support, and monetization depth.

This document is the first of three deliverables. It defines product vision, competitive positioning, system architecture, recommended technology stack, microservices breakdown, infrastructure design for 50 million plus users, India-specific engineering concerns, security model, and a twelve-month execution roadmap. The accompanying Phase 2 deliverable will provide the detailed database schema and entity-relationship diagram; Phase 3 will deliver web and mobile interface wireframes.

### Recommended Architecture at a Glance

| Layer | Recommended Choice | Why |
|---|---|---|
| Web frontend | **Next.js 14** (React, TypeScript) | SEO is oxygen for classifieds; SSR + ISR ranks listings on Google |
| Mobile apps | **Flutter** (single codebase, iOS + Android) | 65% of Indian listings traffic is mobile-only; Flutter delivers native perf with one team |
| Core backend | **Java 21 + Spring Boot 3** microservices | Battle-tested at marketplace scale (Flipkart, Swiggy, OLX itself use JVM stacks) |
| Real-time + edge services | **Node.js (NestJS)** for chat, notifications, BFF | Event-loop model wins for high-concurrency WebSocket / SSE workloads |
| Primary database | **PostgreSQL 16** (Citus for sharding) | Relational integrity for listings/users/orders; Citus scales horizontally |
| Search | **Elasticsearch / OpenSearch** | Faceted search, geo, vernacular tokenizers, autocomplete |
| Cache / queues | **Redis 7 + Apache Kafka** | Hot-path cache, rate limiting; Kafka for events, audit, search indexing |
| Object storage + CDN | S3-compatible (Wasabi/AWS) + **Bunny.net** + CloudFront | Cheap image storage; Bunny is far cheaper in India POPs |
| Container platform | **Kubernetes (EKS) + Istio** | Standard for microservices, mature ecosystem in Indian hiring market |
| Observability | OpenTelemetry, Grafana, Loki, Tempo, Prometheus | Open-source, no vendor lock-in, India-friendly costs |

### Why a Hybrid Stack — Not Pure JS or Pure Java

We recommend a polyglot stack that uses each language where it is strongest. A monolingual Node.js/Next.js stack ships fast and hires cheaply, but the JVM is meaningfully better for the compute-heavy, long-running services that dominate a marketplace (search indexing, pricing, fraud scoring, payments reconciliation, jobs matching). Conversely, a monolingual Java stack is over-engineered for the chat, notification and BFF layers, where Node's event loop and WebSocket ecosystem deliver in days what Spring takes weeks to ship.

The hybrid we propose mirrors the production choices of Flipkart (JVM core + Node BFF), Swiggy (JVM core + Node real-time), and Meesho (JVM core + Node API gateway). It is a proven Indian-scale pattern.

---

## 2. Market Opportunity and Competitive Landscape

### 2.1 India Classifieds Market

India's online classifieds and verticalised marketplace segment is projected to exceed USD 4 billion by 2027, growing at roughly 18% CAGR. The market is fragmented across horizontal players (OLX, Quikr), verticals (Naukri/Apna for jobs, UrbanCompany for services, 99acres/MagicBricks for real estate, CarTrade/CarDekho for autos), and emerging social-commerce players (Meesho, ShareChat-led classifieds).

No single player today owns the full intersection of buy/sell + jobs + services with a modern, vernacular-first, mobile-native experience. **That is the wedge for Classifly.in.**

### 2.2 Competitor Audit

| Dimension | OLX India | Quikr | **Classifly Target** |
|---|---|---|---|
| Categories | Strong: autos, electronics, real estate. Weak: jobs (exited), services (thin) | Broad but spread thin; quality varies by city | Full coverage: goods, jobs, services, real estate, autos, education, events, freelance |
| Search & discovery | Basic filters, weak semantic, no voice | Basic filters, dated UX | AI semantic + voice + vernacular + visual (snap-to-find) |
| Trust & safety | Phone masking; scam complaints common | Reputational issues with fake listings | Mandatory KYC for high-value, escrow option, AI fraud scoring, verified-seller badges |
| Vernacular | Limited Hindi UI, no other Indic languages | Hindi only | **11 languages day one**: English, Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, Punjabi |
| Mobile experience | Acceptable, ad-heavy | Outdated, sluggish | Flutter-native, sub-2s cold start, offline drafts, low-data mode |
| Payments / commerce | Mostly cash; no escrow; OLX Pay limited | Limited | UPI-first, optional escrow, doorstep delivery via Shiprocket/Delhivery |
| Jobs | Exited Indian jobs market | Thin | Full ATS-lite for SMB employers, blue-collar focus with **voice CVs** |
| Services | Limited | Limited; UrbanCompany dominates | Verified pros, scheduled bookings, in-app chat, ratings, instant quotes |
| Monetization | Featured + banner ads | Featured + subscriptions | Featured + boost + verified-pro subs + lead-gen B2B + escrow fee + curated ads |

### 2.3 Differentiation Pillars

- **Vernacular-first.** The user picks language once and the entire experience — including listings and chat translation — is in their language.
- **Trust by design.** KYC tiers, AI fraud detection, escrow option, dispute resolution SLA published on the listing page.
- **Hyperlocal + national.** Location radius slider with intelligent defaults; cross-city for high-value categories like autos and real estate.
- **Voice and visual search.** Snap a photo or speak a query in any supported language.
- **Integrated commerce.** Optional doorstep delivery for goods, escrow for high-value, instant payouts via UPI.
- **Jobs that work for Bharat.** Blue-collar and gig workers can record a voice CV; employers can shortlist with one tap.

---

## 3. Product Vision and Feature Catalog

Classifly is organized into four primary verticals plus a shared trust-and-commerce layer that cuts across them.

### 3.1 Verticals

**Buy and Sell (goods)**
- Categories: electronics, mobiles, vehicles, furniture, fashion, books, home appliances, sports, pets, collectibles, real estate.
- Free posting up to N listings/month per category, featured boost, AI-suggested pricing, condition grading, in-built haggling chat, doorstep pickup option.

**Jobs**
- Categories: white-collar, blue-collar, gig, internships, work-from-home, government-jobs aggregator.
- Voice CV for blue-collar, one-tap apply, employer ATS-lite, candidate verification (Aadhaar masked + PAN), saved searches and alerts, skill assessments.

**Services**
- Categories: home services (plumber, electrician, AC repair), beauty and wellness, tutors, tax/legal, event services, fitness, freelance creative.
- Verified pro badge, scheduled booking with calendar, instant quotes, post-service rating with photo proof, dispute resolution.

**Real Estate** (sub-vertical of Buy/Sell with dedicated UX)
- Categories: rent, buy, PG/hostel, commercial, plots.
- Floorplan upload, 360° photo support, virtual tour scheduling, broker badge, society-name search, near-metro/near-school filters.

### 3.2 Cross-Cutting Features

- **Identity.** Aadhaar-masked KYC, PAN, DigiLocker pull, phone OTP.
- **Communication.** In-app chat (text, image, voice note, video call for paid users), translated messages, phone masking, scheduled callbacks.
- **Discovery.** Semantic search, voice search, visual search, India-aware filters (BHK, fuel type, RAM, etc.), saved searches, alerts.
- **Commerce.** UPI checkout, escrow, delivery integration (Delhivery, Shiprocket), GST invoicing, instant payout.
- **Trust.** Verified badges, ratings and reviews, dispute SLA, photo verification, scam reporting, blocklist.
- **Engagement.** Hyperlocal feed, saved listings, price-drop alerts, recently viewed, collaborative-filtering + content-based recommendations.
- **Monetization.** Featured listings, boost-to-top, verified-pro subscriptions, employer subscriptions, lead packs, curated banner ads, escrow service fee.
- **Accessibility.** WCAG 2.2 AA, screen-reader friendly, low-data mode, dark mode, voice navigation.

---

## 4. Technology Stack: Detailed Recommendation

### 4.1 Decision Framework

You asked us to advise between **Option 1 (Modern JS: Next.js + React Native + PostgreSQL)** and **Option 2 (Enterprise: Spring Boot + Flutter + PostgreSQL)**. Both are viable. Our recommendation is a **hybrid** that takes the best of each.

| Criterion | Modern JS (Next + RN + Node) | Enterprise (Spring Boot + Flutter) | **Winner** |
|---|---|---|---|
| Time to MVP | Faster (single language, shared types) | Slower (more ceremony) | JS |
| Long-term scalability of core services | Acceptable; GC and single-thread limits hurt at scale | Excellent: JVM tuned for marketplace workloads | **Java** |
| Hiring in India (Tier 1) | Huge pool, lower median cost | Huge pool, slightly higher cost, deeper bench | Tie |
| Hiring in India (Tier 2/3) | Easier to find junior JS devs | Java is standard CS curriculum, very strong supply | **Java** |
| Real-time chat / push | Node excels (Socket.io, WS) | Possible but more code (Netty, WebFlux) | **JS** |
| Mobile UX consistency | RN: bridge layer can lag on complex screens | Flutter: native rendering, 60fps trivial | **Flutter** |
| Web SEO | Next.js SSR/ISR is best-in-class | Spring + separate SSR layer needed | **Next.js** |
| Background jobs, batch, ETL | Node weak for CPU-heavy work | JVM excels (Spring Batch, Kafka Streams) | **Java** |
| Payments and ledger code | Acceptable | Industry standard (banks, Razorpay, PhonePe run JVM) | **Java** |
| Operational maturity | Newer ecosystem | Decades of profilers, GC tools, APM, observability | **Java** |

### 4.2 Recommended Hybrid Stack

**Next.js for the web. Flutter for mobile. Java/Spring Boot for the heavy backend. Node.js for the real-time and BFF layer.**

| Component | Choice | Rationale |
|---|---|---|
| Web app | Next.js 14 + TypeScript + Tailwind + shadcn/ui | SSR + ISR + edge for SEO and Tier 2/3 latency |
| Mobile app | Flutter 3.x + Riverpod + Drift (SQLite) | Single codebase, true native perf, offline drafts |
| API gateway | Kong or Spring Cloud Gateway | Rate limiting, OAuth2, request shaping |
| BFF for web/mobile | Node.js (NestJS) + GraphQL Federation | Tailored payloads per client, fast iteration |
| Core services | Java 21 + Spring Boot 3 + Spring Cloud | Listings, users, jobs, payments, search, fraud |
| Real-time services | Node.js (NestJS + Socket.io / WS) | Chat, presence, push, notifications |
| Primary DB | PostgreSQL 16, Citus for shards | Relational integrity, geo, JSONB, mature ops |
| Search engine | Elasticsearch / OpenSearch | Faceted, geo, multilingual analyzers |
| Cache / sessions | Redis 7 (cluster) | Sub-ms hot path |
| Event bus | Apache Kafka (MSK) | Audit log, search indexing, fanout, CDC |
| Object storage | S3-compatible (Wasabi/AWS S3) | Images, videos, voice CVs, KYC docs |
| CDN | Bunny.net + CloudFront | Bunny: cheaper India POPs; CF fallback |
| Orchestration | Kubernetes (EKS) + Istio + ArgoCD | Standard, mature, gitops-native |
| Observability | OpenTelemetry, Grafana, Loki, Tempo, Prometheus | Open-source, no lock-in |
| CI/CD | GitHub Actions + ArgoCD + Helm | Industry standard |
| Data warehouse | ClickHouse + dbt + Airflow | Sub-second analytics, cheap at scale |
| ML platform | Python (FastAPI) + ONNX + Triton | Recos, fraud, search ranking |

---

## 5. High-Level System Architecture

### 5.1 Conceptual Layers

The system is structured into eight horizontal layers, with vertical slices per business domain.

| Layer | Components | Responsibility |
|---|---|---|
| Edge | CloudFront/Bunny CDN, WAF, DDoS shield | TLS termination, static caching, bot mitigation |
| Client | Next.js web, Flutter iOS, Flutter Android, PWA fallback | UI, offline, push receipt |
| API Gateway | Kong or Spring Cloud Gateway | Auth, throttling, routing |
| BFF | Node.js GraphQL gateway (Apollo Federation) | Client-tailored payloads, fan-out |
| Domain Services | 20+ Spring Boot services, 4 Node services | Business logic, persistence, events |
| Async / Event | Kafka topics, Spring Cloud Stream consumers | Indexing, notifications, fraud, audit, ML features |
| Data | Postgres (Citus), Redis cluster, Elasticsearch, S3, ClickHouse | OLTP, cache, search, blobs, analytics |
| Platform / Ops | Kubernetes (EKS), Istio, ArgoCD, OTEL, Vault | Deployment, secrets, observability, policy |

### 5.2 Reference Request Flow — Posting a Listing

1. Client (Flutter) compresses image, requests presigned S3 URL via BFF, uploads directly to S3.
2. Client submits listing payload to BFF; BFF validates, calls Listing Service over gRPC.
3. Listing Service runs business rules (category limits, premium status), persists to Postgres in a transaction, emits `ListingCreated` event to Kafka.
4. Search Indexer consumes event, transforms to ES document, upserts to Elasticsearch.
5. Fraud Service consumes event, scores listing, may flag for moderation.
6. Notification Service consumes event, sends push to saved-search subscribers within radius.
7. Listing returns to client with id; BFF responds within typical **250 ms p95**.

### 5.3 Microservices Inventory

| Service | Lang | Owns Data | Primary Responsibility |
|---|---|---|---|
| identity-service | Java | users, sessions, kyc | Signup, login, OTP, OAuth, KYC tiers |
| listing-service | Java | listings, categories | CRUD listings, category rules, pricing suggestions |
| search-service | Java | ES indexes | Faceted search, autocomplete, ranking |
| jobs-service | Java | job_posts, applications | Job CRUD, applications, ATS workflows |
| services-service | Java | service_offerings, bookings | Service catalog, bookings, calendar |
| chat-service | Node | messages, conversations | Real-time messaging, phone masking, translations |
| notification-service | Node | push tokens, prefs | Push, SMS, email, WhatsApp BSP |
| payment-service | Java | orders, ledger | UPI, cards, wallets, escrow, payouts |
| delivery-service | Java | shipments | Shiprocket / Delhivery integration |
| review-service | Java | reviews, ratings | User and listing reviews |
| fraud-service | Java/Py | fraud features | ML scoring, rule engine, manual queue |
| moderation-service | Java | moderation queue | Image and text moderation, human queue |
| recommendation-service | Python | embeddings | Personalized feed, similar listings |
| pricing-service | Python | price models | Dynamic price suggestions per category |
| geo-service | Java | geo data | Reverse geocode, PIN code, locality graph |
| media-service | Java | media metadata | Transcode, thumbnail, watermark |
| ad-service | Java | ad slots, campaigns | Featured slots, promoted listings, banners |
| subscription-service | Java | plans, entitlements | Verified-pro, employer subs, boost packs |
| analytics-ingest | Java | Kafka → ClickHouse | Event capture for analytics |
| audit-service | Java | audit log | Immutable audit trail, compliance |
| bff-web | Node | (no state) | GraphQL gateway for web |
| bff-mobile | Node | (no state) | GraphQL gateway for mobile |
| admin-bff | Node | (no state) | Internal ops console backend |

---

## 6. Client Architecture

### 6.1 Web (Next.js)

- App Router with React Server Components for catalog and listing detail pages (SSR for SEO).
- ISR with 60-second revalidation; near-instant load from edge.
- Tailwind + shadcn/ui design system; custom Classifly tokens for color, typography, spacing.
- Image optimization via `next/image` and Bunny.net image CDN with WebP/AVIF on the fly.
- Search and authenticated routes are CSR with React Query for caching.
- Internationalization via `next-intl`, 11 locale bundles loaded lazily.
- Web Push (VAPID) for desktop notifications.

### 6.2 Mobile (Flutter)

- Single codebase ships to iOS and Android plus a Flutter Web fallback.
- State with Riverpod; networking via Dio with retry, cache, offline queue.
- Local persistence via Drift (SQLite): offline drafts, saved listings, messages cache.
- Image picker with on-device compression — uploads under 200 KB on typical 3G/4G.
- Voice CV recording with on-device noise reduction; uploads via background isolate.
- FCM for push, deep links, silent updates for chat presence.
- **Low-data mode** disables autoplay, reduces image quality, prefers text snippets.
- Localization via Flutter `intl` with ICU MessageFormat; 11 languages day one.

### 6.3 Cross-Platform Design System

A shared design token set (JSON, output via Style Dictionary) feeds both Tailwind theme and Flutter `ThemeData`. Components are spec'd in Figma with Storybook on web and Widgetbook on Flutter. This gives visual parity across web and mobile with no design drift.

---

## 7. India-Specific Engineering Concerns

### 7.1 Languages and Vernacular

11 languages on day one: English, Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, Punjabi. UI strings are managed in Crowdin. Search uses language-specific Elasticsearch analyzers (`indic_normalizer` plus per-language tokenizers). Listings can be authored in any language; we store the original plus an English translation for cross-language search. Auto-translate uses an in-house fine-tuned model on top of IndicTrans2.

### 7.2 Payments

- **UPI** is primary: Razorpay or Cashfree for collect and intent flows.
- **Wallets**: Paytm, PhonePe, Amazon Pay.
- **Cards**: domestic via RuPay, international via Visa/MC; tokenization compliant with RBI mandate.
- **Escrow**: hold funds in Razorpay Route until buyer confirms delivery; T+1 payout.
- **Refunds**: instant for UPI, 2–5 business days for cards.
- **GST**: invoices generated automatically; HSN/SAC codes per category.

### 7.3 KYC and Compliance

- **Tiered KYC**: Tier 0 (phone OTP, limited listings), Tier 1 (PAN verified, full free tier), Tier 2 (Aadhaar e-KYC via DigiLocker, premium and escrow), Tier 3 (business KYC with GSTIN, employer and pro accounts).
- Aadhaar handling complies with UIDAI rules; we store only the **masked reference plus hash**, never the full number.
- PII at rest encrypted with AWS KMS; **field-level encryption** for Aadhaar reference, PAN, bank account.
- **DPDP Act 2023** compliance: data principal rights (access, correction, erasure), consent ledger, breach notification within 72 hours.
- Children under 18 cannot post listings without parental consent.

### 7.4 Connectivity

Half of Indian smartphone users still rely on 4G with frequent throttling. The mobile app must work on a 256 kbps connection. Performance budgets:

- Cold start **< 2.5 s** on a mid-tier Android (4 GB RAM).
- Home feed first paint **< 1.5 s** on a 4G connection.
- Image payload **< 200 KB** per listing thumbnail.
- Full listing detail **< 500 KB** including 5 images.
- Low-data mode further **halves** these budgets.

### 7.5 Communications

- SMS OTP via Karix or MSG91 with DLT compliance and TRAI sender IDs.
- WhatsApp BSP via Gupshup or AiSensy for transactional messages.
- Email via Amazon SES with India sending domain.
- Push via FCM and APNs.
- Voice OTP read-out (vernacular) via Exotel for accessibility.

---

## 8. Security and Trust

### 8.1 Identity

- OAuth 2.1 with PKCE for first-party clients; short-lived access tokens (15 min), rotating refresh tokens.
- MFA required for high-value sellers and all employer accounts.
- Device binding for refresh tokens; suspicious device triggers re-OTP.

### 8.2 Fraud and Abuse

- ML fraud scoring at listing-create, message-send, and payment-attempt events.
- **Phone masking**: buyer and seller communicate via Classifly-provisioned numbers; we sit in the middle and can intervene.
- Image moderation via AWS Rekognition plus custom model for India-specific patterns (e.g., currency-note close-ups in scam attempts).
- Text moderation for hate speech, illegal goods (weapons, drugs, organs, wildlife).
- Velocity rules: a new account cannot post more than 3 listings in 24h until Tier 1 KYC.
- Bounty-style reporting: users who report verified scams earn boost credits.

### 8.3 Application Security

- Static analysis (Semgrep), dependency scanning (Snyk), container scanning (Trivy) in CI.
- Secrets in HashiCorp Vault with dynamic database credentials.
- WAF (CloudFront + AWS WAF) plus rate limiting at API Gateway.
- Quarterly external penetration tests; private bug bounty via HackerOne.

### 8.4 Data Protection

- TLS 1.3 everywhere; mTLS within the service mesh.
- Encryption at rest for all databases, S3, backups (AWS KMS).
- Field-level encryption for PII.
- Backups: daily full + WAL archiving for Postgres; 35-day retention; cross-region replica.
- **RTO 1 hour, RPO 5 minutes** for tier-0 services.

---

## 9. Scaling Strategy for 50M+ Users

### 9.1 Capacity Targets

| Metric | Year 1 | Year 3 | Year 5 |
|---|---|---|---|
| Monthly active users | 5 M | 30 M | 75 M |
| Daily active users | 1.2 M | 8 M | 22 M |
| Listings live | 5 M | 40 M | 120 M |
| Peak QPS (read) | 8 K | 60 K | 180 K |
| Peak QPS (write) | 500 | 5 K | 15 K |
| Chat messages / day | 5 M | 80 M | 300 M |
| Images stored | 30 M | 300 M | 1.2 B |
| Storage (S3) | 15 TB | 200 TB | 1 PB |
| Search docs | 5 M | 40 M | 120 M |

### 9.2 Scaling Patterns

- **Read scaling.** PgBouncer + Postgres read replicas; Redis cache for hot listings (60 s TTL) with cache-aside pattern.
- **Write scaling.** Citus shards listings by `region_id`; chat messages partitioned by `conversation_id`; events queued through Kafka with idempotent consumers.
- **Search.** Elasticsearch cluster with hot/warm/cold tiers; new listings on hot SSD nodes, listings older than 30 days on warm, sold/expired moved to cold.
- **Stateless services.** Every Spring Boot and Node service is horizontally scalable behind k8s HPA on CPU and custom metrics (request queue depth).
- **Image pipeline.** S3 + on-the-fly resize via Bunny.net image CDN; no pre-generated thumbnails to store.
- **Geo-distribution.** Primary region `ap-south-1` (Mumbai), read replicas in `ap-south-2` (Hyderabad) for DR, Bangalore POP for low latency.
- **Backpressure.** Every queue consumer publishes lag metric; PagerDuty pages SRE if lag > 1 min on tier-0 topics.
- **Graceful degradation.** Search → category browse if ES degraded; chat → polling if WS fleet overloaded; recos → popularity if ML service down.

---

## 10. Observability and DevOps

### 10.1 Observability

- Distributed tracing with OpenTelemetry; Grafana Tempo backend.
- Structured logs to Loki; one line per request with `trace_id` + `user_id`.
- Metrics to Prometheus; RED + USE dashboards per service.
- Business metrics in ClickHouse: listings posted/sold, applications, GMV, take rate; refreshed every 5 min.
- SLOs published per service; SLO-burn alerts route to PagerDuty.

### 10.2 Delivery

- Trunk-based development; every PR triggers tests, lint, security scan, build, ephemeral preview env.
- ArgoCD reconciles k8s manifests from a gitops repo; promotion is a PR.
- **Canary releases via Istio**: 1% traffic for 10 min, auto-promote if SLO holds, auto-rollback otherwise.
- Feature flags via Unleash; every risky feature is dark-launched.
- Mobile releases on a 2-week cadence via Firebase App Distribution for beta, then phased Play Store / App Store rollout.

### 10.3 Environments

`local` (Docker Compose subset), `dev` (shared, free-for-all), `staging` (prod-mirror, integration tests), `perf` (load-test target), `prod` (multi-AZ).

---

## 11. Indicative Infrastructure Cost

AWS Mumbai pricing, early 2026, with reasonable RI commits.

| Stage | MAU | Compute | Data + Search | Storage + CDN | Total INR / mo |
|---|---|---|---|---|---|
| MVP launch | 100 K | ₹1.5 L | ₹0.8 L | ₹0.4 L | **₹2.7 L (~$3.2 K)** |
| Year 1 | 5 M | ₹8 L | ₹5 L | ₹3 L | **₹16 L (~$19 K)** |
| Year 3 | 30 M | ₹45 L | ₹30 L | ₹25 L | **₹1 Cr (~$120 K)** |
| Year 5 | 75 M | ₹1.1 Cr | ₹70 L | ₹70 L | **₹2.5 Cr (~$300 K)** |

Headcount and third-party services (SMS, KYC, image moderation APIs, payments take rate) are **not** in the above; expect them to be **2–3×** infrastructure cost at scale.

---

## 12. Twelve-Month Roadmap

### Q1 (M1–M3) — Foundations & MVP
- Repo setup, CI/CD, k8s clusters, baseline observability.
- Identity, listing, search, chat, basic media services.
- Web (Next.js) + Flutter app: home, search, listing detail, post-ad, chat.
- 5 categories: mobiles, vehicles, furniture, real estate, jobs.
- Hindi + English UI; SMS OTP; phone masking.
- Internal alpha with 500 users in Bangalore.

### Q2 (M4–M6) — Public Beta + Trust
- Aadhaar / PAN KYC tiers; verified-seller badge.
- Fraud service v1; image and text moderation.
- Payments: UPI + featured-listing purchase.
- Add 10 more categories incl. electronics, fashion, services.
- 4 more languages (Bengali, Telugu, Marathi, Tamil).
- Public beta in 8 metros; target **250 K MAU**.

### Q3 (M7–M9) — Jobs, Services, Monetization
- Full Jobs vertical with ATS-lite, voice CV, blue-collar UX.
- Services vertical with bookings, calendar, verified pros.
- Subscriptions: verified-pro, employer plans, boost packs.
- Recommendations v1 (collaborative filtering).
- 5 more languages, bringing total to 11.
- Tier 2 city launch; target **1 M MAU**.

### Q4 (M10–M12) — Commerce, AI, Scale
- Escrow service GA; doorstep delivery via Shiprocket/Delhivery.
- Voice search, visual search (snap-to-find).
- AI translation across messages and listings.
- Recommendations v2 (deep learning + content embeddings).
- Web/mobile perf pass; cold start < 2 s; p95 < 250 ms.
- Pan-India launch; target **5 M MAU**; first paid TV campaign.

### 12.1 Suggested Team Shape at End of Year 1

- **Engineering:** 1 VP, 4 EMs, 35 engineers (20 backend, 6 web, 6 mobile, 3 SRE).
- **Data & ML:** 1 EM, 3 data engineers, 3 ML engineers, 2 analysts.
- **Design:** 1 head, 3 product designers, 1 UX researcher.
- **Product:** 1 CPO, 4 PMs (one per vertical + platform).
- **Trust & Safety:** 1 lead, 8 moderators (24×7 shifts), 1 ops manager.
- **Growth:** 1 head, 3 marketers, 2 lifecycle managers, 1 SEO lead.

---

## 13. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fraudulent listings damaging brand trust | High | High | Tiered KYC, ML fraud scoring, phone masking, public dispute SLA, rapid takedown |
| OLX or Quikr aggressive response | Medium | Medium | Differentiate on vernacular, services, trust; avoid feature-for-feature wars |
| Spam in chat | High | Medium | Per-account daily message caps, NLP filters, easy report-and-block |
| RBI / DPDP regulatory shift | Medium | High | Compliance officer by M6; modular consent ledger; quarterly legal review |
| Scaling pains at sudden viral growth | Medium | High | HPA, queue backpressure, graceful degradation, quarterly game days |
| Mobile app rejection by Apple/Google | Low | High | Strict policy review in CI; pre-submission audit; staged rollout |
| Hiring delays (senior SRE / ML) | Medium | Medium | Remote-first; Turing/Toptal for stopgaps; equity-heavy comp for senior |

---

## 14. What Phase 2 and Phase 3 Will Deliver

### Phase 2 — Database Schema and ERD

- Detailed PostgreSQL DDL for every table referenced here (users, kyc, listings, categories, attributes, media, jobs, applications, services, bookings, conversations, messages, orders, payments, ledger, reviews, ads, subscriptions, audit).
- Mermaid ERD diagram showing all relationships at a glance.
- Indexing strategy, partitioning plan (Citus shards for listings, time-based for messages and audit).
- Elasticsearch index mappings.
- Redis key conventions and TTLs.
- Sample seed data and test fixtures.

### Phase 3 — Web and Mobile UI Wireframes

- **Web screens:** home feed, search results with filters, listing detail with chat panel, post-ad multi-step wizard, profile, jobs hub, services hub, employer dashboard, services-pro dashboard.
- **Mobile screens:** corresponding views with mobile-first patterns — bottom nav, swipe gestures, voice-CV recording, snap-to-find camera UI.
- Interactive HTML prototypes you can click through and share with stakeholders.
- Design tokens that map to both Tailwind and Flutter `ThemeData`.

---

*Once you've reviewed this Phase 1 document and confirmed direction, we'll proceed to Phase 2 (database schema).*
