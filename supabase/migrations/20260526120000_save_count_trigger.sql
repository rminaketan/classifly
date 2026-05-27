-- =====================================================================
-- Classifly.in — Denormalised listings.save_count
-- =====================================================================
-- Keeps listings.save_count in sync with the number of saved_listings
-- rows pointing at each listing. The home/search feeds read save_count
-- directly to render "N saves" without a per-card subquery.
--
-- INSERT / DELETE on saved_listings fire the trigger; UPDATE is ignored
-- because (user_id, listing_id) is the primary key and is never updated
-- in practice. Upserts that hit ON CONFLICT DO NOTHING (the path used by
-- POST /api/saved-listings) do not fire an INSERT trigger, so duplicate
-- saves don't double-count.
-- =====================================================================

SET lock_timeout = '5s';
SET statement_timeout = '5min';

CREATE OR REPLACE FUNCTION listings_save_count_tg() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE listings
       SET save_count = save_count + 1
     WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- GREATEST guards against drift if the count ever went stale.
    UPDATE listings
       SET save_count = GREATEST(save_count - 1, 0)
     WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_listings_save_count ON saved_listings;
CREATE TRIGGER trg_listings_save_count
  AFTER INSERT OR DELETE ON saved_listings
  FOR EACH ROW EXECUTE FUNCTION listings_save_count_tg();

-- One-shot reconciliation: bring existing save_count values in line with
-- whatever saved_listings rows already exist. Cheap when the table is
-- small (which it is until M1 launch), and idempotent on re-runs.
UPDATE listings l
   SET save_count = sub.cnt
  FROM (
    SELECT listing_id, COUNT(*) AS cnt
      FROM saved_listings
     GROUP BY listing_id
  ) sub
 WHERE sub.listing_id = l.id
   AND l.save_count <> sub.cnt;

-- Zero out listings that have no saved_listings rows but a non-zero count.
UPDATE listings
   SET save_count = 0
 WHERE save_count <> 0
   AND NOT EXISTS (SELECT 1 FROM saved_listings s WHERE s.listing_id = listings.id);
