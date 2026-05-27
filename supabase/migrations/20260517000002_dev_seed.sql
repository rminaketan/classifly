-- =====================================================================
-- Classifly.in — Dev seed data
-- =====================================================================
-- Seeds reference data: top 30 Indian cities, root + sub-categories,
-- attribute schemas for popular categories, feature flag defaults.
--
-- Safe to re-run: every INSERT uses ON CONFLICT DO NOTHING.
-- This migration is applied in dev / staging / prod alike — the data
-- (cities, categories) is needed everywhere.
-- =====================================================================


-- ---------- CITIES ----------
INSERT INTO cities (name, state, slug, population, is_tier, location) VALUES
  ('Mumbai',       'Maharashtra',    'mumbai',       20411000, 1, ST_MakePoint(72.8777, 19.0760)::geography),
  ('Delhi',        'Delhi',          'delhi',        32941000, 1, ST_MakePoint(77.1025, 28.7041)::geography),
  ('Bengaluru',    'Karnataka',      'bengaluru',    13193000, 1, ST_MakePoint(77.5946, 12.9716)::geography),
  ('Hyderabad',    'Telangana',      'hyderabad',    10534000, 1, ST_MakePoint(78.4867, 17.3850)::geography),
  ('Ahmedabad',    'Gujarat',        'ahmedabad',     8650000, 1, ST_MakePoint(72.5714, 23.0225)::geography),
  ('Chennai',      'Tamil Nadu',     'chennai',      11503000, 1, ST_MakePoint(80.2707, 13.0827)::geography),
  ('Kolkata',      'West Bengal',    'kolkata',      14979000, 1, ST_MakePoint(88.3639, 22.5726)::geography),
  ('Pune',         'Maharashtra',    'pune',          7376000, 1, ST_MakePoint(73.8567, 18.5204)::geography),
  ('Jaipur',       'Rajasthan',      'jaipur',        4068000, 2, ST_MakePoint(75.7873, 26.9124)::geography),
  ('Surat',        'Gujarat',        'surat',         7489000, 2, ST_MakePoint(72.8311, 21.1702)::geography),
  ('Lucknow',      'Uttar Pradesh',  'lucknow',       3677000, 2, ST_MakePoint(80.9462, 26.8467)::geography),
  ('Kanpur',       'Uttar Pradesh',  'kanpur',        3068000, 2, ST_MakePoint(80.3319, 26.4499)::geography),
  ('Nagpur',       'Maharashtra',    'nagpur',        2893000, 2, ST_MakePoint(79.0882, 21.1458)::geography),
  ('Indore',       'Madhya Pradesh', 'indore',        3197000, 2, ST_MakePoint(75.8577, 22.7196)::geography),
  ('Thane',        'Maharashtra',    'thane',         2486000, 2, ST_MakePoint(72.9781, 19.2183)::geography),
  ('Bhopal',       'Madhya Pradesh', 'bhopal',        2426000, 2, ST_MakePoint(77.4126, 23.2599)::geography),
  ('Visakhapatnam','Andhra Pradesh', 'visakhapatnam', 2358000, 2, ST_MakePoint(83.2185, 17.6868)::geography),
  ('Patna',        'Bihar',          'patna',         2392000, 2, ST_MakePoint(85.1376, 25.5941)::geography),
  ('Vadodara',     'Gujarat',        'vadodara',      2179000, 2, ST_MakePoint(73.2080, 22.3072)::geography),
  ('Ghaziabad',    'Uttar Pradesh',  'ghaziabad',     2375000, 2, ST_MakePoint(77.4538, 28.6692)::geography),
  ('Ludhiana',     'Punjab',         'ludhiana',      1854000, 2, ST_MakePoint(75.8573, 30.9010)::geography),
  ('Agra',         'Uttar Pradesh',  'agra',          1760000, 2, ST_MakePoint(78.0081, 27.1767)::geography),
  ('Nashik',       'Maharashtra',    'nashik',        2237000, 2, ST_MakePoint(73.7898, 19.9975)::geography),
  ('Faridabad',    'Haryana',        'faridabad',     1525000, 2, ST_MakePoint(77.3178, 28.4089)::geography),
  ('Meerut',       'Uttar Pradesh',  'meerut',        1424000, 2, ST_MakePoint(77.7064, 28.9845)::geography),
  ('Rajkot',       'Gujarat',        'rajkot',        1390000, 2, ST_MakePoint(70.8022, 22.3039)::geography),
  ('Kalyan-Dombivli','Maharashtra',  'kalyan',        1247000, 2, ST_MakePoint(73.1305, 19.2403)::geography),
  ('Vasai-Virar',  'Maharashtra',    'vasai',         1222000, 2, ST_MakePoint(72.8397, 19.4259)::geography),
  ('Varanasi',     'Uttar Pradesh',  'varanasi',      1198000, 2, ST_MakePoint(82.9739, 25.3176)::geography),
  ('Gurgaon',      'Haryana',        'gurgaon',       1153000, 1, ST_MakePoint(77.0266, 28.4595)::geography)
ON CONFLICT (slug) DO NOTHING;


-- ---------- CATEGORIES (top-level + sub) ----------
INSERT INTO categories (slug, name, vertical, depth, is_leaf, display_order, name_i18n) VALUES
  ('mobiles',         'Mobiles',                'goods',       0, false, 10, '{"hi":"मोबाइल"}'),
  ('electronics',     'Electronics & Appliances','goods',      0, false, 20, '{"hi":"इलेक्ट्रॉनिक्स"}'),
  ('vehicles',        'Vehicles',               'goods',       0, false, 30, '{"hi":"वाहन"}'),
  ('furniture',       'Furniture & Home',       'goods',       0, false, 40, '{"hi":"फर्नीचर"}'),
  ('fashion',         'Fashion',                'goods',       0, false, 50, '{"hi":"फैशन"}'),
  ('books-sports',    'Books, Sports & Hobbies','goods',       0, false, 60, '{"hi":"किताबें, खेल"}'),
  ('pets',            'Pets',                   'goods',       0, false, 70, '{"hi":"पालतू जानवर"}'),
  ('real-estate',     'Real Estate',            'real_estate', 0, false, 80, '{"hi":"रियल एस्टेट"}'),
  ('jobs',            'Jobs',                   'jobs',        0, false, 90, '{"hi":"नौकरियां"}'),
  ('services',        'Services',               'services',    0, false, 100,'{"hi":"सेवाएं"}')
ON CONFLICT (vertical, slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name, vertical, depth, is_leaf, display_order)
SELECT id, sub_slug, sub_name, 'goods', 1, true, n FROM categories,
  (VALUES
    ('mobile-phones', 'Mobile Phones', 10),
    ('accessories',   'Accessories',   20),
    ('tablets',       'Tablets',       30),
    ('smartwatches',  'Smartwatches',  40)
  ) AS sub(sub_slug, sub_name, n)
WHERE categories.slug = 'mobiles' AND categories.vertical = 'goods'
ON CONFLICT (vertical, slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name, vertical, depth, is_leaf, display_order)
SELECT id, sub_slug, sub_name, 'goods', 1, true, n FROM categories,
  (VALUES
    ('cars',                'Cars',                10),
    ('motorcycles',         'Motorcycles',         20),
    ('scooters',            'Scooters',            30),
    ('bicycles',            'Bicycles',            40),
    ('commercial-vehicles', 'Commercial Vehicles', 50),
    ('spare-parts',         'Spare Parts',         60)
  ) AS sub(sub_slug, sub_name, n)
WHERE categories.slug = 'vehicles' AND categories.vertical = 'goods'
ON CONFLICT (vertical, slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name, vertical, depth, is_leaf, display_order)
SELECT id, sub_slug, sub_name, 'real_estate', 1, true, n FROM categories,
  (VALUES
    ('flats-for-rent', 'Flats for Rent',  10),
    ('flats-for-sale', 'Flats for Sale',  20),
    ('houses',         'Houses & Villas', 30),
    ('pg-hostel',      'PG & Hostel',     40),
    ('commercial',     'Commercial',      50),
    ('plots',          'Plots & Land',    60)
  ) AS sub(sub_slug, sub_name, n)
WHERE categories.slug = 'real-estate' AND categories.vertical = 'real_estate'
ON CONFLICT (vertical, slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name, vertical, depth, is_leaf, display_order)
SELECT id, sub_slug, sub_name, 'jobs', 1, true, n FROM categories,
  (VALUES
    ('full-time',       'Full-time',         10),
    ('part-time',       'Part-time',         20),
    ('gig-blue-collar', 'Gig / Blue-collar', 30),
    ('internship',      'Internship',        40),
    ('work-from-home',  'Work from Home',    50)
  ) AS sub(sub_slug, sub_name, n)
WHERE categories.slug = 'jobs' AND categories.vertical = 'jobs'
ON CONFLICT (vertical, slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name, vertical, depth, is_leaf, display_order)
SELECT id, sub_slug, sub_name, 'services', 1, true, n FROM categories,
  (VALUES
    ('home-repair',     'Home Repair',       10),
    ('cleaning',        'Cleaning',          20),
    ('beauty-wellness', 'Beauty & Wellness', 30),
    ('tutors',          'Tutors',            40),
    ('event-services',  'Event Services',    50),
    ('legal-tax',       'Legal & Tax',       60),
    ('movers-packers',  'Movers & Packers',  70),
    ('freelance',       'Freelance',         80)
  ) AS sub(sub_slug, sub_name, n)
WHERE categories.slug = 'services' AND categories.vertical = 'services'
ON CONFLICT (vertical, slug) DO NOTHING;


-- ---------- CATEGORY ATTRIBUTES ----------
INSERT INTO category_attributes (category_id, key, label, data_type, options, is_required, is_filterable, display_order)
SELECT id, k, lbl, dt, opts::jsonb, req, filt, ord FROM categories,
  (VALUES
    ('brand',    'Brand',         'enum',    '["Apple","Samsung","Xiaomi","OnePlus","Realme","Vivo","Oppo","Motorola","Other"]', true,  true,  10),
    ('model',    'Model',         'text',    NULL,                                                                              true,  false, 20),
    ('ram',      'RAM',           'enum',    '["2GB","3GB","4GB","6GB","8GB","12GB","16GB"]',                                  false, true,  30),
    ('storage',  'Storage',       'enum',    '["16GB","32GB","64GB","128GB","256GB","512GB","1TB"]',                            false, true,  40),
    ('warranty', 'Under Warranty','boolean', NULL,                                                                              false, true,  50)
  ) AS a(k, lbl, dt, opts, req, filt, ord)
WHERE categories.slug = 'mobile-phones' AND categories.vertical = 'goods'
ON CONFLICT (category_id, key) DO NOTHING;

INSERT INTO category_attributes (category_id, key, label, data_type, options, is_required, is_filterable, display_order)
SELECT id, k, lbl, dt, opts::jsonb, req, filt, ord FROM categories,
  (VALUES
    ('brand',        'Brand',           'enum',    '["Maruti Suzuki","Hyundai","Tata","Mahindra","Honda","Toyota","Kia","MG","Volkswagen","Skoda","Ford","Renault","Nissan","BMW","Mercedes","Audi","Other"]', true, true, 10),
    ('model',        'Model',           'text',    NULL,                                                                                                                                                       true, false, 20),
    ('year',         'Year',            'integer', NULL,                                                                                                                                                       true, true, 30),
    ('km_driven',    'KM Driven',       'integer', NULL,                                                                                                                                                       true, true, 40),
    ('fuel_type',    'Fuel Type',       'enum',    '["Petrol","Diesel","CNG","LPG","Electric","Hybrid"]',                                                                                                       true, true, 50),
    ('transmission', 'Transmission',    'enum',    '["Manual","Automatic"]',                                                                                                                                    true, true, 60),
    ('owners',       'Number of Owners','enum',    '["1st","2nd","3rd","4+"]',                                                                                                                                  false, true, 70)
  ) AS a(k, lbl, dt, opts, req, filt, ord)
WHERE categories.slug = 'cars' AND categories.vertical = 'goods'
ON CONFLICT (category_id, key) DO NOTHING;

INSERT INTO category_attributes (category_id, key, label, data_type, options, is_required, is_filterable, display_order)
SELECT id, k, lbl, dt, opts::jsonb, req, filt, ord FROM categories,
  (VALUES
    ('bhk',              'BHK',              'enum',    '["1 RK","1 BHK","2 BHK","3 BHK","4 BHK","5+ BHK"]', true,  true,  10),
    ('furnishing',       'Furnishing',       'enum',    '["Furnished","Semi-furnished","Unfurnished"]',      true,  true,  20),
    ('carpet_area',      'Carpet Area (sq ft)','integer', NULL,                                              false, true,  30),
    ('floor',            'Floor',            'integer', NULL,                                                false, false, 40),
    ('parking',          'Parking',          'enum',    '["None","2-wheeler","4-wheeler","Both"]',           false, true,  50),
    ('preferred_tenant', 'Preferred Tenant', 'enum',    '["Family","Bachelor","Anyone","Company"]',          false, true,  60),
    ('deposit',          'Deposit (₹)',      'integer', NULL,                                                false, false, 70)
  ) AS a(k, lbl, dt, opts, req, filt, ord)
WHERE categories.slug = 'flats-for-rent' AND categories.vertical = 'real_estate'
ON CONFLICT (category_id, key) DO NOTHING;


-- ---------- FEATURE FLAGS ----------
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('feature.escrow',                false, 'Show escrow option at checkout'),
  ('feature.voice_cv',              false, 'Enable voice CV upload in jobs'),
  ('feature.video_listings',        false, 'Allow video upload to listings'),
  ('feature.visual_search',         false, 'Snap-to-find image search'),
  ('feature.delivery_integration',  false, 'Doorstep delivery via Shiprocket'),
  ('feature.business_kyc_required', true,  'Require GSTIN for business accounts'),
  ('listing.expiry_days',           true,  'Listings auto-expire after N days'),
  ('moderation.image_ai',           true,  'Run Cloudflare AI image moderation on upload')
ON CONFLICT (key) DO NOTHING;

UPDATE feature_flags SET payload = '{"days":60}'::jsonb
  WHERE key = 'listing.expiry_days' AND payload = '{}'::jsonb;
