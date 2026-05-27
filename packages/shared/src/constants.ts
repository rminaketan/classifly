/** App-wide constants. Anything used by both web and mobile lives here. */

export const VERTICALS = ['goods', 'jobs', 'services', 'real_estate'] as const;
export type Vertical = (typeof VERTICALS)[number];

export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'paused',
  'sold',
  'expired',
  'removed',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const PRICE_TYPES = ['fixed', 'negotiable', 'free', 'on_request'] as const;
export type PriceTypeKey = (typeof PRICE_TYPES)[number];

export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'for_parts'] as const;
export type ConditionKey = (typeof CONDITIONS)[number];

export const KYC_TIERS = ['tier0', 'tier1', 'tier2', 'tier3'] as const;
export type KycTier = (typeof KYC_TIERS)[number];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'اردو' },
] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/** Listing limits (per-category per-month for free tier). */
export const FREE_LISTING_LIMITS: Record<string, number> = {
  mobiles: 5,
  vehicles: 3,
  'real-estate': 3,
  furniture: 10,
  electronics: 10,
  jobs: 1,
  services: 1,
  default: 5,
};

/** Listing default expiry, in days, from posting. Matches `feature_flags.listing.expiry_days`. */
export const DEFAULT_LISTING_EXPIRY_DAYS = 60;

/**
 * Boost pricing tiers (featured listing). Source of truth for amounts —
 * server actions look up the price here, never trust client-passed amounts.
 */
export const BOOST_TIERS = [
  { id: 'b7',  durationDays: 7,  priceInr: 99,  label: '7 days',  tagline: 'Top of category' },
  { id: 'b30', durationDays: 30, priceInr: 299, label: '30 days', tagline: 'Best value' },
] as const;
export type BoostTier = (typeof BOOST_TIERS)[number];
export type BoostTierId = BoostTier['id'];

/** Storage upload caps the app enforces client-side AND in API routes. */
export const UPLOAD_LIMITS = {
  imageMaxBytes: 5 * 1024 * 1024,        // 5 MB raw upload; client compresses to WebP before
  videoMaxBytes: 30 * 1024 * 1024,       // 30 MB
  videoMaxSeconds: 30,
  voiceCvMaxSeconds: 90,
  resumeMaxBytes: 2 * 1024 * 1024,       // 2 MB
  maxImagesPerListing: 10,
  maxImagesPerFeaturedListing: 25,
  imageMimes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  videoMimes: ['video/mp4', 'video/webm'] as const,
};
