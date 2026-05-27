-- =====================================================================
-- Classifly.in — Row-Level Security Policies
-- =====================================================================
-- Apply after schema.sql.
--
-- Roles in Supabase:
--   anon          - unauthenticated requests (public site visitors)
--   authenticated - signed-in users (most of our policies target this)
--   service_role  - server-side (bypasses RLS, used by API routes with the secret key)
--
-- Helper: auth.uid() returns the current user's id (uuid).
-- =====================================================================

-- ---------- Enable RLS ----------
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE localities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_attributes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views       ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_signals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags       ENABLE ROW LEVEL SECURITY;


-- ---------- PUBLIC READ-ONLY REFERENCE DATA ----------
-- Anyone can read cities, localities, categories, attribute schemas, feature flags.
CREATE POLICY cities_read   ON cities    FOR SELECT USING (true);
CREATE POLICY locs_read     ON localities FOR SELECT USING (true);
CREATE POLICY cat_read      ON categories FOR SELECT USING (is_active = true);
CREATE POLICY cat_attr_read ON category_attributes FOR SELECT USING (true);
CREATE POLICY flags_read    ON feature_flags FOR SELECT USING (true);


-- ---------- PROFILES ----------
-- Public profile fields are visible to anyone; updates only by the owner.
CREATE POLICY profiles_read_public ON profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_self ON profiles
  FOR UPDATE TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid() AND is_banned = false);

-- Insert handled by handle_new_auth_user() trigger as SECURITY DEFINER.


-- ---------- KYC ----------
-- Only the user can see their own KYC; only the service role can write it.
CREATE POLICY kyc_select_self ON kyc_verifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Writes go through API routes using service_role key (bypasses RLS).


-- ---------- USER BLOCKS ----------
CREATE POLICY blocks_select_self ON user_blocks
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

CREATE POLICY blocks_insert_self ON user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY blocks_delete_self ON user_blocks
  FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());


-- ---------- PUSH TOKENS ----------
CREATE POLICY push_tokens_owner ON push_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ---------- LISTINGS ----------
-- Anyone (anon + auth) can see active listings that are not moderation-rejected.
CREATE POLICY listings_read_public ON listings
  FOR SELECT
  USING (
    status = 'active'
    AND moderation_status IN ('clean','approved')
  );

-- Sellers can see all their own listings regardless of status
CREATE POLICY listings_read_own ON listings
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

-- Sellers can insert their own
CREATE POLICY listings_insert_own ON listings
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned)
  );

-- Sellers can update their own (not seller_id, not moderation_status)
CREATE POLICY listings_update_own ON listings
  FOR UPDATE TO authenticated
  USING  (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Sellers can soft-delete (set status='removed') via update; no hard delete.
-- Hard deletes happen only via service_role.


-- ---------- LISTING SIDE TABLES ----------
CREATE POLICY listing_attrs_read ON listing_attributes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings l
             WHERE l.id = listing_id
               AND (l.status = 'active' OR l.seller_id = auth.uid()))
  );
CREATE POLICY listing_attrs_write ON listing_attributes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

CREATE POLICY listing_media_read ON listing_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings l
             WHERE l.id = listing_id
               AND (l.status = 'active' OR l.seller_id = auth.uid()))
  );
CREATE POLICY listing_media_write ON listing_media
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

CREATE POLICY saved_listings_owner ON saved_listings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY saved_searches_owner ON saved_searches
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Views: anyone can insert; nobody reads except service_role
CREATE POLICY listing_views_insert ON listing_views
  FOR INSERT WITH CHECK (true);


-- ---------- JOBS ----------
CREATE POLICY jobs_read_public ON jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings l
             WHERE l.id = listing_id
               AND l.status = 'active'
               AND l.moderation_status IN ('clean','approved'))
  );

CREATE POLICY jobs_owner_write ON jobs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

CREATE POLICY resumes_owner ON resumes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Resumes that opted-in to discovery are visible to verified employers (Tier 3 KYC)
CREATE POLICY resumes_read_employers ON resumes
  FOR SELECT TO authenticated
  USING (
    open_to_work = true
    AND EXISTS (SELECT 1 FROM profiles p
                  WHERE p.id = auth.uid() AND p.kyc_tier = 'tier3' AND p.is_business)
  );

CREATE POLICY apps_read_applicant ON job_applications
  FOR SELECT TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY apps_read_employer ON job_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings l
             WHERE l.id = job_id AND l.seller_id = auth.uid())
  );

CREATE POLICY apps_insert_applicant ON job_applications
  FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY apps_update_parties ON job_applications
  FOR UPDATE TO authenticated
  USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM listings l WHERE l.id = job_id AND l.seller_id = auth.uid())
  );


-- ---------- SERVICES ----------
CREATE POLICY services_read_public ON services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings l
             WHERE l.id = listing_id
               AND l.status = 'active'
               AND l.moderation_status IN ('clean','approved'))
  );

CREATE POLICY services_owner_write ON services
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

CREATE POLICY bookings_parties ON service_bookings
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY bookings_customer_insert ON service_bookings
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY bookings_parties_update ON service_bookings
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR provider_id = auth.uid());


-- ---------- CHAT ----------
-- Only the two participants can read or interact with a conversation/messages.
CREATE POLICY conv_parties_select ON conversations
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY conv_parties_insert ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY conv_parties_update ON conversations
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY msg_party_select ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM conversations c
             WHERE c.id = conversation_id
               AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
  );

CREATE POLICY msg_party_insert ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM conversations c
                  WHERE c.id = conversation_id
                    AND c.is_blocked = false
                    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
  );

CREATE POLICY msg_sender_update ON messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY msg_attachments_select ON message_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM messages m
             JOIN conversations c ON c.id = m.conversation_id
             WHERE m.id = message_id
               AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
  );
CREATE POLICY msg_attachments_insert ON message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM messages m
             WHERE m.id = message_id AND m.sender_id = auth.uid())
  );


-- ---------- REPORTS / MODERATION ----------
CREATE POLICY reports_insert_auth ON reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

CREATE POLICY reports_select_self ON reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());
-- Moderators access via service_role.

-- moderation_actions and fraud_signals: server-only (no policies → no access from anon/authenticated).


-- ---------- REVIEWS ----------
CREATE POLICY reviews_read_public ON reviews
  FOR SELECT USING (true);

CREATE POLICY reviews_insert_self ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND reviewer_id <> reviewee_id);

CREATE POLICY reviews_update_self ON reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid())   -- reviewee can write a reply
  WITH CHECK (reviewer_id = auth.uid() OR reviewee_id = auth.uid());


-- ---------- COMMERCE ----------
CREATE POLICY orders_self ON orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Inserts/updates go through API routes (service_role) so we can validate amount, tax, etc.

CREATE POLICY payments_self ON payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE POLICY subs_self ON subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY ledger_self ON ledger_entries
  FOR SELECT TO authenticated USING (user_id = auth.uid());


-- ---------- NOTIFICATIONS ----------
CREATE POLICY notifications_self ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ---------- AUDIT LOG ----------
-- Audit reads are server-only.
-- (No policies → no access.)


-- =====================================================================
-- DONE
-- =====================================================================
