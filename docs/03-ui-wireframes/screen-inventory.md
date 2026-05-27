# Screen Inventory & UX Notes

Reference document for every screen in `prototype.html`. Read alongside the prototype — these are the design rationale, edge cases, and engineering notes that the wireframes themselves can't fully convey.

---

## Web screens

### 1. Home
**Goal:** within 5 seconds, the visitor sees something they want to click.

Layout (top → bottom): sticky search header → vertical pills → featured carousel (5 items, promoted ads + verified-only mix) → 4-card vertical splits (Buy/Sell, Jobs, Services, Real Estate) → hyperlocal feed (8 listings, "Near you in Bengaluru") → trust panel.

**Engineering notes**
- The hyperlocal feed comes from `search_listings()` with a default `radius_km=10` and `vertical=NULL`.
- Featured carousel ranks by `is_featured DESC, boost_score DESC, posted_at DESC` (per `schema.sql` § search function).
- Vertical splits show denormalized counts from `categories.listing_count`.
- City picker writes to `profiles.city_id` for signed-in users and to a cookie for anonymous.

**Edge cases**
- New city with < 30 active listings → fallback to "Trending in India" feed.
- User has saved searches → insert a "New since you last visited (12)" strip above featured.
- Low-data mode → drop carousel images to 240×160, no autoplay videos.

### 2. Search results
**Goal:** let the buyer narrow 8,000 results to 5 in under 30 seconds.

Layout: breadcrumb → header (title, result count, sort, view toggle, save-search) → 280-pixel filter rail (sticky) → 3-column listing grid.

**Engineering notes**
- Filter rail is built dynamically from `category_attributes` for the active leaf category. Chips for enum, sliders for integer, range inputs for price/year.
- Active filters serialize to URL query string for bookmarking and sharing.
- "Save search" stores the URL params as JSONB in `saved_searches.filters` and adds a notification subscription.
- Map toggle lazy-loads MapTiler.

**Edge cases**
- Zero results → "No matches. Try widening to 50 km?" with a one-tap radius increase.
- Featured listings always appear in the first 4 results regardless of sort (capped at 2 per page after that).
- Verified-only toggle defaults ON when category is `flats-for-rent` or `cars`.

### 3. Listing detail
**Goal:** answer every question a buyer has *before* they message the seller, so the first chat is a real intent message.

Layout: breadcrumb → 2-column (1fr + 360px). Left column: gallery → title+price card → spec table → description → similar listings. Right rail: seller card + chat CTA + safety tips + inspection/escrow add-ons.

**Engineering notes**
- Gallery is a CSS scroll-snap row on web; on mobile, full-bleed swipe.
- Phone-number reveal is a *single* action that increments `listings.contact_count` and creates a `conversations` row in advance so the seller is notified.
- Spec table is rendered from `listing_attributes.attrs` JSONB; missing values show as "—" not empty rows.
- Similar listings: SQL `listings WHERE category_id = X AND id <> $1 AND city_id = $2 ORDER BY abs(price - $3) LIMIT 8`.

**Edge cases**
- Listing is `sold` or `expired` → grey out CTA, show "This listing is no longer available" banner; still allow browsing similar.
- Seller is the current user → swap "Chat" for "Edit listing" + show analytics (views, chats, saves).
- Listing was reported and is `under_review` → owner sees an amber banner; everyone else sees a 404-style page.

### 4. Post-ad wizard
**Goal:** make posting feel like 4 minutes, not 14.

Layout: 4-step rail on the left (Category → Details → Photos → Price & location); current step content on the right.

**Engineering notes**
- Each step writes to a draft `listings` row (status=`draft`); the next step resumes from there. User can leave and return.
- Category-attribute fields are rendered from `category_attributes` rows for the chosen leaf category. Required ones are validated client-side and server-side.
- "Also write in Hindi" duplicates the description block with a Devanagari input; both are stored (the second goes into `metadata.description_i18n.hi`).
- Photos upload via R2 presigned URLs (see `02-database/storage.md`); the wizard shows a skeleton card per pending upload and swaps to thumbnail when complete.

**Edge cases**
- User has hit the per-category free-tier limit → at the start of Step 1, prompt "You've used 5 of 5 free ads in Mobiles this month. Upgrade or pick a different category."
- Photo upload fails (network) → keep the file in IndexedDB / Drift, retry on next app open.
- KYC tier too low for the category (e.g., posting a car requires Tier 1+) → block with "Verify your PAN to post in Vehicles. Takes 30 seconds."

### 5. Profile
Layout: left rail (profile card + nav list); main pane (filterable grid of my listings).

**Engineering notes**
- Each listing card shows quick-action buttons: Edit, Boost (opens Razorpay), Mark sold (state change to `sold`), Delete (soft → `removed`).
- KYC tier badge links to the KYC upgrade flow.
- Wallet balance is `SUM(amount * sign) FROM ledger_entries WHERE user_id = $1` (sign = +1 for credit, -1 for debit).

**Edge cases**
- Banned user (`is_banned = true`) → entire main pane replaced by "Your account is suspended. Contact support." plus appeal CTA.
- Zero listings → empty state card "Post your first ad" with example listings carousel and a 1-tap "Start now" button.

### 6. Chat (web)
Layout: 3-column (300px conversation list, flexible thread, 320px listing context rail).

**Engineering notes**
- Live updates via Supabase Realtime subscription on `messages` filtered by conversation_id.
- Phone numbers and email-like patterns in messages are auto-redacted client-side and replaced with `[shared via Classifly]` (server validates).
- "Make an offer" creates a `messages` row with `type='offer'` and `payload={amount, currency}` — renders as a special bubble with Accept / Counter / Decline buttons.
- Block/Report writes to `user_blocks` / `reports` and hides the thread.

**Edge cases**
- Other party is banned → header shows red "User suspended" banner; input is disabled.
- Listing has been sold → input disabled; banner says "Conversation archived because the listing was marked sold."
- Long messages truncate at 4,000 chars (matches DB constraint).

### 7. Jobs hub
Distinct from listings: vertical-specific filters (experience, salary range, work mode, job type), "Apply with voice CV" CTA for blue-collar.

**Engineering notes**
- Job cards highlight `is_urgent=true` with a red "Hiring urgently" badge.
- Voice CV button records audio (max 90s, MediaRecorder API), uploads to R2 as Opus, stores URL in `job_applications.voice_cv_url`.
- "1-click apply" uses the latest snapshot of the user's `resumes` row.

**Edge cases**
- User has no resume → first-time apply triggers a 30-second "Quick resume" sheet (name, headline, skills, voice CV) instead of blocking.
- Job past its `application_deadline` → button replaced with "Applications closed".
- Employer hits subscription limit on applications viewed → upgrade prompt.

### 8. Services hub
Layout: search → 6-tile categories grid → top-rated pros cards (per category) with Book Now / Get Quote.

**Engineering notes**
- "Book now" opens a calendar drawer scoped to `services.availability` JSONB.
- "Get quote" opens a quick chat with templated first message ("Hi, I need a quote for ... please.").
- Verified Pro badge requires Tier 2 KYC + insurance docs.

**Edge cases**
- No pros nearby → suggest widening radius, then surface remote-friendly services (tutors, lawyers, designers).
- Pro has `is_blocked` from booking → button greys out with "Currently not accepting new bookings".

---

## Mobile screens

All mobile screens share:
- 5-button bottom nav: Home · Search · (FAB +Sell) · Chat · Profile.
- 44 dp minimum tap target for every interactive element.
- Edge-to-edge image carousels on listing detail.
- Pull-to-refresh on feed screens (not shown in static prototype but implemented in Flutter via `RefreshIndicator`).
- All primary CTAs in the lower 60% of the screen, within thumb-reach.

### M1. Home (mobile)
Same building blocks as web home but stacked: city chip in top-left → search with mic-search button → vertical pills (horizontal scroll) → featured strip (horizontal scroll) → 4×2 categories grid → vertical card stack of "Near you".

**Notable patterns**
- Mic-search button (orange) opens voice-search overlay; uses on-device speech recognition when available, falls back to Cloudflare AI Whisper.
- City chip tap opens a bottom-sheet city picker.

### M2. Search + filter sheet
Single screen with search input + filter icon → active filter chips (×-removable) → result count + sort.

**Notable patterns**
- Filter button opens a full-screen modal (Material 3 `showModalBottomSheet`) with all filters from `category_attributes`.
- Listing cards are horizontal layout (image left, text right) — better for one-thumb scroll than grid.

### M3. Listing detail
Full-bleed image carousel at top → action FABs over image (back, save, share) → title + price card → tabbed body (Details / Description / Seller) → seller mini-card → safety tip → sticky bottom bar with Call + Chat.

**Notable patterns**
- Sticky bottom CTA bar above the nav (so neither chat nor nav fight for space).
- Tabs are a `TabBar` with body in `TabBarView`; no extra screen needed.

### M4. Post-ad
Step-by-step full-screen sheets. Top: X (close + save draft) → step indicator → progress bar. Body: photos grid with cover badge, "Camera" and "Gallery" CTAs as dashed-border tiles. Tips and AI-photo-check toggle below.

**Notable patterns**
- Camera tile uses the device camera directly (no intermediate gallery picker).
- Reorder is by long-press drag (Flutter `ReorderableListView` adapted to grid via `ReorderableGridView`).
- AI photo check toggle is on by default; explains what it removes inline.

### M5. Chat thread
Header has back arrow + avatar + name (with KYC badge) + presence dot + call + menu. Listing context strip directly below header. Message bubbles use color (primary blue) for outbound, white for inbound. Bottom input above the nav: `+`, text input, mic, send.

**Notable patterns**
- Long-press on a message reveals: copy, forward, delete, report.
- Tap on listing strip jumps to listing detail.
- Voice messages: hold-to-record on the mic button.

### M6. Profile
Colored header (primary blue) with avatar, name, KYC + rating badges, Edit button. KYC progress card overlapping the header bottom edge. 3×2 action grid (My ads, Saved, Wallet, Reviews, Boost, Help). Settings list (Language, Low-data mode toggle, Notifications, Privacy, Sign out). Footer with version + "Made in India".

**Notable patterns**
- Low-data mode is a single tap toggle, prominently surfaced — not buried in settings.
- KYC progress is always visible until Tier 3 is reached (then it disappears).

---

## Screens deferred to a future round

| Screen | Why deferred |
|---|---|
| Onboarding (welcome carousel + language pick + phone OTP entry) | Standard pattern; design after we user-test the core marketplace |
| KYC capture flow (PAN, Aadhaar via DigiLocker, business GSTIN) | Specific to vendor SDKs (Surepass, IDfy); design after vendor pick |
| Employer dashboard (review applicants, schedule interviews) | Build once we have 100+ employer signups |
| Service-pro dashboard (calendar, leads, earnings) | Build once we have 50+ active pros |
| Admin moderation console | Internal product; separate spec |
| Web settings / privacy / DPDP data export | Compliance-critical, will be its own design pass |
| Empty states (no chats, no saved, no listings) | Specced briefly in this doc; full visuals in next round |
| Error states (offline, server down, payment failed) | Standard library will be applied uniformly |

---

## India-specific UX details encoded in the prototype

- **Bilingual buttons** ("SELL" in English alongside `नौकरियां` in Hindi on the Jobs card) — never machine-translate the brand voice.
- **₹ symbol with Indian numbering** (`₹5.25 L`, `₹62,000`) — no `$` or `M`.
- **Phone-mask explainer** is present on every chat — trust is earned by *showing* the system at work.
- **Hyperlocal + city chip first-class** (not hidden in a hamburger).
- **Voice CV** as a first-class CTA in jobs — gigs are won by speed, not by typing skill.
- **Low-data mode toggle** on profile, not in settings sub-menu — discoverable to users on capped data plans.
- **KYC tier badges everywhere** seller info appears — buyers learn to look for them.
- **Walk-in interview** filter for jobs — relevant to Bharat, irrelevant to silicon-valley clones.
- **Safety tips on every listing detail** — explicit, not legalese.

These details matter more than visual polish.
