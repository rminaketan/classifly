-- =====================================================================
-- Classifly.in — Lean Postgres Schema (Supabase-compatible)
-- =====================================================================
-- Version 1.0 · May 2026
--
-- Run order:
--   1) schema.sql          (this file)
--   2) rls_policies.sql
--   3) seed.sql            (optional, dev only)
--
-- This file is idempotent enough to apply via `supabase db reset`.
-- It assumes Supabase has already provisioned the `auth` schema.
-- =====================================================================


-- ---------- EXTENSIONS ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "unaccent";


-- ---------- UUID v7 GENERATOR ----------
-- Time-sortable UUIDs play much nicer with B-tree indexes than v4.
-- Borrowed from the community spec; pure-SQL implementation.
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms := substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3);
  uuid_bytes := unix_ts_ms || gen_random_bytes(10);
  uuid_bytes := set_byte(uuid_bytes, 6, (b'01110000' | (get_byte(uuid_bytes, 6) & 15))::bit(8)::int);
  uuid_bytes := set_byte(uuid_bytes, 8, (b'10000000' | (get_byte(uuid_bytes, 8) & 63))::bit(8)::int);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END $$;


-- ---------- ENUMS ----------
-- Each in its own DO block so a partial previous run doesn't skip later enums.
DO $$ BEGIN CREATE TYPE vertical               AS ENUM ('goods','jobs','services','real_estate'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_tier               AS ENUM ('tier0','tier1','tier2','tier3'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_type               AS ENUM ('phone','email','pan','aadhaar_masked','digilocker','gstin','bank_account'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kyc_status             AS ENUM ('pending','verified','failed','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE listing_status         AS ENUM ('draft','pending_review','active','paused','sold','expired','removed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE moderation_status      AS ENUM ('clean','flagged','under_review','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE price_type             AS ENUM ('fixed','negotiable','free','on_request'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE listing_condition      AS ENUM ('new','like_new','good','fair','for_parts'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE media_type             AS ENUM ('image','video','audio','document','floorplan','panorama_360'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_type               AS ENUM ('full_time','part_time','contract','gig','internship','volunteer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE work_mode              AS ENUM ('onsite','remote','hybrid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE salary_period          AS ENUM ('hourly','daily','weekly','monthly','yearly','per_task'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE application_status     AS ENUM ('applied','viewed','shortlisted','interview','offered','rejected','withdrawn','hired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE service_price_type     AS ENUM ('hourly','flat','per_visit','quote'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status         AS ENUM ('requested','quoted','confirmed','in_progress','completed','cancelled','no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE message_type           AS ENUM ('text','image','voice','video','offer','location','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_target_type     AS ENUM ('listing','user','message','review','service','job'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_status          AS ENUM ('open','triaged','actioned','dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE moderation_action_type AS ENUM ('warn','hide','remove','suspend','ban','restore'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_type             AS ENUM ('featured_listing','boost','subscription','escrow','lead_pack'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status           AS ENUM ('created','paid','failed','refunded','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method         AS ENUM ('upi','card','netbanking','wallet','emi','bank_transfer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status         AS ENUM ('initiated','authorized','captured','failed','refunded','disputed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_status    AS ENUM ('trialing','active','past_due','cancelled','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type      AS ENUM ('message','listing','application','booking','payment','system','marketing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ledger_entry_type      AS ENUM ('credit','debit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =====================================================================
-- TAXONOMY & GEO
-- =====================================================================

CREATE TABLE IF NOT EXISTS cities (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  name         text NOT NULL,
  state        text NOT NULL,
  country      text NOT NULL DEFAULT 'IN',
  location     geography(Point, 4326),
  population   integer,
  is_tier      smallint,                       -- 1=metro, 2=tier2, 3=tier3, 4=tier4
  slug         text NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cities_state   ON cities(state);
CREATE INDEX IF NOT EXISTS idx_cities_geo     ON cities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_cities_name_tr ON cities USING GIN(name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS localities (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  city_id     uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name        text NOT NULL,
  kind        text,                            -- neighborhood, sector, society, locality
  pin_code    text,
  location    geography(Point, 4326),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, name)
);
CREATE INDEX IF NOT EXISTS idx_localities_city ON localities(city_id);
CREATE INDEX IF NOT EXISTS idx_localities_pin  ON localities(pin_code);
CREATE INDEX IF NOT EXISTS idx_localities_geo  ON localities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_localities_trg  ON localities USING GIN(name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS categories (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  parent_id     uuid REFERENCES categories(id) ON DELETE RESTRICT,
  vertical      vertical NOT NULL,
  slug          text NOT NULL,
  name          text NOT NULL,
  name_i18n     jsonb NOT NULL DEFAULT '{}'::jsonb,    -- { "hi": "मोबाइल", "ta": "..." }
  icon_url      text,
  depth         smallint NOT NULL DEFAULT 0,
  is_leaf       boolean NOT NULL DEFAULT true,
  is_active     boolean NOT NULL DEFAULT true,
  listing_count integer NOT NULL DEFAULT 0,            -- denormalized for category pages
  display_order integer NOT NULL DEFAULT 100,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vertical, slug)
);
CREATE INDEX IF NOT EXISTS idx_categories_parent   ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_vertical ON categories(vertical, is_active);

CREATE TABLE IF NOT EXISTS category_attributes (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  category_id  uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  key          text NOT NULL,                  -- e.g. "ram", "fuel_type"
  label        text NOT NULL,
  label_i18n   jsonb DEFAULT '{}'::jsonb,
  data_type    text NOT NULL,                  -- enum, integer, decimal, text, boolean
  options      jsonb,                          -- ["Petrol","Diesel","CNG","Electric"] etc.
  is_required  boolean NOT NULL DEFAULT false,
  is_filterable boolean NOT NULL DEFAULT true,
  is_searchable boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 100,
  UNIQUE (category_id, key)
);


-- =====================================================================
-- IDENTITY
-- =====================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle          citext UNIQUE,                 -- @rohit (optional)
  display_name    text,
  avatar_url      text,
  bio             text,
  phone_e164      text,                          -- mirrored from auth.users for fast lookups
  email           citext,
  city_id         uuid REFERENCES cities(id),
  locality_id     uuid REFERENCES localities(id),
  preferred_lang  text NOT NULL DEFAULT 'en',
  kyc_tier        kyc_tier NOT NULL DEFAULT 'tier0',
  is_business     boolean NOT NULL DEFAULT false,
  business_name   text,
  gstin           text,
  rating_avg      numeric(3,2),
  rating_count    integer NOT NULL DEFAULT 0,
  listings_count  integer NOT NULL DEFAULT 0,
  is_banned       boolean NOT NULL DEFAULT false,
  banned_reason   text,
  last_active_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_city     ON profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone    ON profiles(phone_e164);
CREATE INDEX IF NOT EXISTS idx_profiles_business ON profiles(is_business) WHERE is_business;
CREATE INDEX IF NOT EXISTS idx_profiles_handle   ON profiles(handle);

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_auth_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, phone_e164, email)
  VALUES (NEW.id, NEW.phone, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type                kyc_type NOT NULL,
  status              kyc_status NOT NULL DEFAULT 'pending',
  reference_masked    text,                       -- e.g. last 4 of PAN, masked Aadhaar ref
  reference_hash      text,                       -- sha256 of full reference (for dedup, NOT PII)
  verification_data   jsonb,                      -- ENCRYPTED at application layer (pgsodium when on Pro)
  vendor              text,                       -- 'surepass', 'idfy', 'digilocker'
  vendor_request_id   text,
  verified_at         timestamptz,
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)                          -- one per user per type
);
CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_verifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_kyc_hash ON kyc_verifications(reference_hash);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id    text NOT NULL,
  token        text NOT NULL,
  platform     text NOT NULL,                       -- ios, android, web
  app_version  text,
  last_seen    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_tokens(user_id);


-- =====================================================================
-- LISTINGS CORE
-- =====================================================================

CREATE TABLE IF NOT EXISTS listings (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  seller_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id         uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  vertical            vertical NOT NULL,
  title               text NOT NULL,
  description         text,
  price               numeric(12,2),
  price_type          price_type NOT NULL DEFAULT 'fixed',
  currency            text NOT NULL DEFAULT 'INR',
  condition           listing_condition,
  city_id             uuid REFERENCES cities(id),
  locality_id         uuid REFERENCES localities(id),
  location            geography(Point, 4326),
  address             text,
  status              listing_status NOT NULL DEFAULT 'pending_review',
  moderation_status   moderation_status NOT NULL DEFAULT 'clean',
  language            text NOT NULL DEFAULT 'en',
  is_featured         boolean NOT NULL DEFAULT false,
  featured_until      timestamptz,
  boost_score         real NOT NULL DEFAULT 0,        -- updated by ranking job
  view_count          integer NOT NULL DEFAULT 0,
  contact_count       integer NOT NULL DEFAULT 0,
  save_count          integer NOT NULL DEFAULT 0,
  search_vector       tsvector,                       -- maintained by trigger
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  posted_at           timestamptz,
  expires_at          timestamptz,
  removed_at          timestamptz,
  removed_reason      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Critical indexes for marketplace browsing
CREATE INDEX IF NOT EXISTS idx_listings_browse
  ON listings(vertical, status, city_id, posted_at DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_category
  ON listings(category_id, status, posted_at DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_seller
  ON listings(seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_featured
  ON listings(is_featured, featured_until DESC)
  WHERE is_featured AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_fts
  ON listings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
  ON listings USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_geo
  ON listings USING GIST(location)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_expiry
  ON listings(expires_at)
  WHERE status = 'active' AND expires_at IS NOT NULL;

-- Per-listing extended attributes (kept narrow on the hot table)
CREATE TABLE IF NOT EXISTS listing_attributes (
  listing_id   uuid PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  attrs        jsonb NOT NULL DEFAULT '{}'::jsonb,    -- {"ram":"8GB","storage":"128GB"}
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listing_attrs_gin
  ON listing_attributes USING GIN(attrs);

CREATE TABLE IF NOT EXISTS listing_media (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  listing_id    uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  type          media_type NOT NULL DEFAULT 'image',
  url           text NOT NULL,                       -- R2 public URL
  thumbnail_url text,
  width         integer,
  height        integer,
  duration_sec  integer,                              -- video/audio
  sort_order    integer NOT NULL DEFAULT 0,
  blurhash      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_listing ON listing_media(listing_id, sort_order);

CREATE TABLE IF NOT EXISTS saved_listings (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  saved_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_listings(user_id, saved_at DESC);

CREATE TABLE IF NOT EXISTS saved_searches (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            text,
  query_text      text,
  filters         jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {category_id, min_price, max_price, city_id, radius_km, attrs:{}}
  notify_push     boolean NOT NULL DEFAULT true,
  notify_email    boolean NOT NULL DEFAULT false,
  last_notified_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- Sampled view tracking (we don't insert one row per pageview at scale; debounced in app layer)
CREATE TABLE IF NOT EXISTS listing_views (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  listing_id  uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ip_hash     text,
  user_agent  text,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_views_listing ON listing_views(listing_id, viewed_at DESC);


-- =====================================================================
-- JOBS VERTICAL
-- =====================================================================

CREATE TABLE IF NOT EXISTS jobs (
  listing_id            uuid PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  job_type              job_type NOT NULL,
  work_mode             work_mode NOT NULL DEFAULT 'onsite',
  experience_years_min  smallint,
  experience_years_max  smallint,
  salary_min            numeric(12,2),
  salary_max            numeric(12,2),
  salary_period         salary_period DEFAULT 'monthly',
  skills                text[] NOT NULL DEFAULT '{}',
  education_min         text,
  openings              integer NOT NULL DEFAULT 1,
  application_deadline  date,
  apply_url             text,                            -- external apply
  is_urgent             boolean NOT NULL DEFAULT false,
  is_walkin             boolean NOT NULL DEFAULT false,
  walkin_address        text,
  walkin_dates          daterange
);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills);

CREATE TABLE IF NOT EXISTS resumes (
  user_id          uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  headline         text,
  summary          text,
  experience       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{company,title,start,end,desc}]
  education        jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills           text[] NOT NULL DEFAULT '{}',
  resume_url       text,                                  -- R2: resumes/{user_id}.pdf
  voice_cv_url     text,                                  -- R2: voice-cvs/{user_id}.opus
  expected_salary  numeric(12,2),
  expected_period  salary_period,
  open_to_work     boolean NOT NULL DEFAULT true,
  last_updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resumes_open ON resumes(open_to_work) WHERE open_to_work;
CREATE INDEX IF NOT EXISTS idx_resumes_skills ON resumes USING GIN(skills);

CREATE TABLE IF NOT EXISTS job_applications (
  id                uuid PRIMARY KEY DEFAULT uuidv7(),
  job_id            uuid NOT NULL REFERENCES jobs(listing_id) ON DELETE CASCADE,
  applicant_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            application_status NOT NULL DEFAULT 'applied',
  cover_text        text,
  resume_url        text,                            -- snapshot at apply-time
  voice_cv_url      text,
  employer_note     text,
  applied_at        timestamptz NOT NULL DEFAULT now(),
  status_updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
CREATE INDEX IF NOT EXISTS idx_apps_job
  ON job_applications(job_id, status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_applicant
  ON job_applications(applicant_id, applied_at DESC);


-- =====================================================================
-- SERVICES VERTICAL
-- =====================================================================

CREATE TABLE IF NOT EXISTS services (
  listing_id           uuid PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  service_price_type   service_price_type NOT NULL DEFAULT 'quote',
  rate_min             numeric(12,2),
  rate_max             numeric(12,2),
  availability         jsonb NOT NULL DEFAULT '{}'::jsonb, -- weekly schedule
  service_radius_km    integer DEFAULT 10,
  response_time_hours  integer DEFAULT 24,
  is_verified_pro      boolean NOT NULL DEFAULT false,
  insurance_covered    boolean NOT NULL DEFAULT false,
  years_experience     smallint
);

CREATE TABLE IF NOT EXISTS service_bookings (
  id                uuid PRIMARY KEY DEFAULT uuidv7(),
  service_id        uuid NOT NULL REFERENCES services(listing_id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id       uuid NOT NULL REFERENCES profiles(id),
  scheduled_at      timestamptz,
  duration_minutes  integer,
  status            booking_status NOT NULL DEFAULT 'requested',
  quoted_price      numeric(12,2),
  final_price       numeric(12,2),
  address           text,
  location          geography(Point, 4326),
  notes             text,
  cancellation_reason text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_service  ON service_bookings(service_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON service_bookings(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON service_bookings(provider_id, scheduled_at);


-- =====================================================================
-- CHAT
-- =====================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  listing_id      uuid REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message_preview text,
  buyer_unread    integer NOT NULL DEFAULT 0,
  seller_unread   integer NOT NULL DEFAULT 0,
  buyer_archived  boolean NOT NULL DEFAULT false,
  seller_archived boolean NOT NULL DEFAULT false,
  is_blocked      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id, seller_id),
  CHECK (buyer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_buyer  ON conversations(buyer_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conv_seller ON conversations(seller_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            message_type NOT NULL DEFAULT 'text',
  body            text,
  payload         jsonb,                              -- e.g. {offer_amount, currency} for type='offer'
  read_at         timestamptz,
  edited_at       timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv
  ON messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS message_attachments (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  message_id  uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  type        media_type NOT NULL,
  url         text NOT NULL,
  thumbnail_url text,
  size_bytes  bigint,
  metadata    jsonb
);


-- =====================================================================
-- TRUST & SAFETY
-- =====================================================================

CREATE TABLE IF NOT EXISTS reports (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  reporter_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_type  report_target_type NOT NULL,
  target_id    uuid NOT NULL,
  reason       text NOT NULL,
  details      text,
  status       report_status NOT NULL DEFAULT 'open',
  resolved_by  uuid REFERENCES profiles(id),
  resolution   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_open   ON reports(status, created_at) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS moderation_actions (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  target_type  report_target_type NOT NULL,
  target_id    uuid NOT NULL,
  action       moderation_action_type NOT NULL,
  moderator_id uuid REFERENCES profiles(id),
  reason       text,
  expires_at   timestamptz,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mod_target ON moderation_actions(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fraud_signals (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  target_type   text NOT NULL,                       -- 'listing' or 'user'
  target_id     uuid NOT NULL,
  signal        text NOT NULL,                       -- 'image_phone_overlay', 'too_many_listings_24h', etc.
  score         real,
  payload       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fraud_target ON fraud_signals(target_type, target_id, created_at DESC);


-- =====================================================================
-- REVIEWS
-- =====================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  reviewer_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id    uuid REFERENCES listings(id) ON DELETE SET NULL,
  booking_id    uuid REFERENCES service_bookings(id) ON DELETE SET NULL,
  rating        smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          text,
  photos        text[],                              -- R2 URLs
  is_verified   boolean NOT NULL DEFAULT false,      -- true if linked to a paid order/booking
  reply_body    text,
  reply_at      timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reviewer_id, reviewee_id, listing_id),
  CHECK (reviewer_id <> reviewee_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_listing  ON reviews(listing_id, created_at DESC);


-- =====================================================================
-- COMMERCE
-- =====================================================================

CREATE TABLE IF NOT EXISTS orders (
  id                 uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type               order_type NOT NULL,
  reference_id       uuid,                          -- listing_id or subscription_id
  amount             numeric(12,2) NOT NULL,
  currency           text NOT NULL DEFAULT 'INR',
  tax_amount         numeric(12,2) NOT NULL DEFAULT 0,
  total_amount       numeric(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  status             order_status NOT NULL DEFAULT 'created',
  razorpay_order_id  text UNIQUE,
  metadata           jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);

CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  method              payment_method NOT NULL,
  amount              numeric(12,2) NOT NULL,
  status              payment_status NOT NULL DEFAULT 'initiated',
  razorpay_payment_id text UNIQUE,
  failure_reason      text,
  captured_at         timestamptz,
  refunded_at         timestamptz,
  refund_amount       numeric(12,2),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id                  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan                     text NOT NULL,                     -- 'verified_pro_monthly', 'employer_starter', etc.
  status                   subscription_status NOT NULL DEFAULT 'active',
  starts_at                timestamptz NOT NULL,
  ends_at                  timestamptz NOT NULL,
  trial_ends_at            timestamptz,
  razorpay_subscription_id text UNIQUE,
  cancelled_at             timestamptz,
  cancellation_reason      text,
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_user_active
  ON subscriptions(user_id, status)
  WHERE status IN ('active','trialing');

CREATE TABLE IF NOT EXISTS ledger_entries (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type        ledger_entry_type NOT NULL,
  amount      numeric(12,2) NOT NULL,
  currency    text NOT NULL DEFAULT 'INR',
  reason      text NOT NULL,                       -- 'featured_listing_purchase', 'refund', 'credit_bonus'
  reference_type text,                              -- 'order','subscription','payment','manual'
  reference_id   uuid,
  balance_after  numeric(12,2),
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id, created_at DESC);


-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       text NOT NULL,
  body        text,
  data        jsonb,                                -- deep link, ids, etc.
  read_at     timestamptz,
  delivered_via text[],                             -- {push,email,sms,inapp}
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;


-- =====================================================================
-- ADMIN / AUDIT / FLAGS
-- =====================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  actor_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action       text NOT NULL,                       -- 'listing.update', 'user.ban'
  target_type  text,
  target_id    uuid,
  payload      jsonb,                                -- diff or full snapshot
  ip_hash      text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_log(actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,    -- rollout %, allowlist, variants
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);


-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- updated_at autoset
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['profiles','listings','listing_attributes','service_bookings','feature_flags']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;

-- Listing FTS update (title + description + city + category, with unaccent + english stem)
CREATE OR REPLACE FUNCTION listings_update_search_vector() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  city_name text;
  cat_name  text;
BEGIN
  SELECT name INTO city_name FROM cities WHERE id = NEW.city_id;
  SELECT name INTO cat_name  FROM categories WHERE id = NEW.category_id;
  NEW.search_vector :=
       setweight(to_tsvector('simple', unaccent(coalesce(NEW.title,''))), 'A')
    || setweight(to_tsvector('simple', unaccent(coalesce(cat_name,''))),  'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(city_name,''))), 'C')
    || setweight(to_tsvector('simple', unaccent(coalesce(NEW.description,''))), 'D');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_listings_fts ON listings;
CREATE TRIGGER trg_listings_fts
  BEFORE INSERT OR UPDATE OF title, description, category_id, city_id
  ON listings
  FOR EACH ROW EXECUTE FUNCTION listings_update_search_vector();

-- Denormalized counts on profile
CREATE OR REPLACE FUNCTION profiles_listing_count_tg() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET listings_count = listings_count + 1 WHERE id = NEW.seller_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET listings_count = listings_count - 1 WHERE id = OLD.seller_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_profiles_listing_count ON listings;
CREATE TRIGGER trg_profiles_listing_count
  AFTER INSERT OR DELETE ON listings
  FOR EACH ROW EXECUTE FUNCTION profiles_listing_count_tg();

-- Category listing_count denorm (incremented when a listing transitions to active)
CREATE OR REPLACE FUNCTION categories_listing_count_tg() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE categories SET listing_count = listing_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'active' AND OLD.status <> 'active' THEN
      UPDATE categories SET listing_count = listing_count + 1 WHERE id = NEW.category_id;
    ELSIF NEW.status <> 'active' AND OLD.status = 'active' THEN
      UPDATE categories SET listing_count = listing_count - 1 WHERE id = NEW.category_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE categories SET listing_count = listing_count - 1 WHERE id = OLD.category_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_categories_listing_count ON listings;
CREATE TRIGGER trg_categories_listing_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON listings
  FOR EACH ROW EXECUTE FUNCTION categories_listing_count_tg();

-- Conversation last-message bookkeeping
CREATE OR REPLACE FUNCTION conversations_on_message_tg() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations c
     SET last_message_at      = NEW.created_at,
         last_message_preview = LEFT(coalesce(NEW.body, '(attachment)'), 140),
         buyer_unread  = CASE WHEN NEW.sender_id = c.seller_id THEN buyer_unread + 1 ELSE buyer_unread END,
         seller_unread = CASE WHEN NEW.sender_id = c.buyer_id  THEN seller_unread + 1 ELSE seller_unread END
   WHERE c.id = NEW.conversation_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_conv_on_message ON messages;
CREATE TRIGGER trg_conv_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION conversations_on_message_tg();

-- Profile rating rollup on review insert/update
CREATE OR REPLACE FUNCTION profiles_rating_tg() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE target uuid;
BEGIN
  target := COALESCE(NEW.reviewee_id, OLD.reviewee_id);
  UPDATE profiles p SET
    rating_avg   = (SELECT round(avg(rating)::numeric, 2) FROM reviews WHERE reviewee_id = target),
    rating_count = (SELECT count(*) FROM reviews WHERE reviewee_id = target)
  WHERE p.id = target;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_rating ON reviews;
CREATE TRIGGER trg_profiles_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION profiles_rating_tg();


-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Listings near a point with FTS + category + price filter (called by API)
CREATE OR REPLACE FUNCTION search_listings(
  q text DEFAULT NULL,
  cat_id uuid DEFAULT NULL,
  vert vertical DEFAULT NULL,
  lat double precision DEFAULT NULL,
  lng double precision DEFAULT NULL,
  radius_km integer DEFAULT NULL,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  lim integer DEFAULT 30,
  off integer DEFAULT 0
) RETURNS SETOF listings
LANGUAGE sql STABLE AS $$
  SELECT l.* FROM listings l
   WHERE l.status = 'active'
     AND (cat_id IS NULL OR l.category_id = cat_id)
     AND (vert IS NULL OR l.vertical = vert)
     AND (min_price IS NULL OR l.price >= min_price)
     AND (max_price IS NULL OR l.price <= max_price)
     AND (q IS NULL OR l.search_vector @@ websearch_to_tsquery('simple', unaccent(q)))
     AND (
       lat IS NULL OR lng IS NULL OR radius_km IS NULL
       OR ST_DWithin(l.location, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
     )
   ORDER BY
     l.is_featured DESC,
     l.boost_score DESC,
     l.posted_at DESC NULLS LAST
   LIMIT lim OFFSET off;
$$;


-- =====================================================================
-- REALTIME PUBLICATION (Supabase)
-- =====================================================================

-- Enable Supabase Realtime on tables the client subscribes to (chat).
-- Run on Supabase only:  ALTER PUBLICATION supabase_realtime ADD TABLE messages, conversations;


-- =====================================================================
-- DONE
-- =====================================================================
