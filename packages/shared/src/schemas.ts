/**
 * Zod schemas — the single source of truth for API request/response shapes.
 * Used by Next.js server actions for validation and by the mobile app for
 * client-side validation. Mirror the database constraints in schema.sql.
 */
import { z } from 'zod';

// ---------- Primitives ----------
export const uuid = z.string().uuid();

/** Indian phone number in E.164 form, e.g. +919876543210. */
export const phoneE164 = z
  .string()
  .regex(/^\+91\d{10}$/, 'Use +91 followed by 10 digits, e.g. +919876543210');

export const otpCode = z.string().regex(/^\d{6}$/, '6-digit OTP');

export const inrPrice = z.number().min(0).max(99_99_99_999.99);

// ---------- Enums ----------
export const verticalSchema = z.enum(['goods', 'jobs', 'services', 'real_estate']);
export const priceTypeSchema = z.enum(['fixed', 'negotiable', 'free', 'on_request']);
export const conditionSchema = z.enum(['new', 'like_new', 'good', 'fair', 'for_parts']);
export const listingStatusSchema = z.enum([
  'draft',
  'pending_review',
  'active',
  'paused',
  'sold',
  'expired',
  'removed',
]);

// ---------- Auth ----------
export const signInWithPhoneSchema = z.object({
  phone: phoneE164,
});

export const verifyOtpSchema = z.object({
  phone: phoneE164,
  code: otpCode,
});

// ---------- Profile ----------
export const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  city_id: uuid.optional(),
  locality_id: uuid.optional(),
  preferred_lang: z.string().length(2).optional(),
});

// ---------- Listings ----------
export const createListingSchema = z.object({
  category_id: uuid,
  vertical: verticalSchema,
  title: z.string().min(8, 'Title is too short').max(120),
  description: z.string().max(4000).optional(),
  price: inrPrice.optional().nullable(),
  price_type: priceTypeSchema.default('fixed'),
  condition: conditionSchema.optional().nullable(),
  city_id: uuid.optional().nullable(),
  locality_id: uuid.optional().nullable(),
  address: z.string().max(200).optional(),
  language: z.string().length(2).default('en'),
  attrs: z.record(z.unknown()).default({}),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = createListingSchema.partial().extend({
  id: uuid,
  status: listingStatusSchema.optional(),
});
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const searchListingsSchema = z.object({
  q: z.string().max(200).optional(),
  vertical: verticalSchema.optional(),
  category_id: uuid.optional(),
  city_id: uuid.optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().min(1).max(500).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(60).default(20),
});
export type SearchListingsParams = z.infer<typeof searchListingsSchema>;

// ---------- Media upload (presigned URL) ----------
export const uploadUrlRequestSchema = z.object({
  kind: z.enum(['listing', 'avatar', 'review', 'resume', 'voice_cv', 'kyc']),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  listingId: uuid.optional(),
});
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

// ---------- Chat ----------
export const sendMessageSchema = z.object({
  conversation_id: uuid,
  type: z.enum(['text', 'image', 'voice', 'video', 'offer', 'location']).default('text'),
  body: z.string().max(4000).optional(),
  payload: z.record(z.unknown()).optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const startConversationSchema = z.object({
  listing_id: uuid,
  initial_message: z.string().min(1).max(1000),
});
export type StartConversationInput = z.infer<typeof startConversationSchema>;

// ---------- Saved searches ----------
export const savedSearchFiltersSchema = z.object({
  vertical: verticalSchema.optional(),
  category_id: uuid.optional(),
  city_id: uuid.optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
});
export type SavedSearchFilters = z.infer<typeof savedSearchFiltersSchema>;

export const createSavedSearchSchema = z.object({
  name: z.string().min(2).max(80),
  query_text: z.string().max(200).optional(),
  filters: savedSearchFiltersSchema.default({}),
});
export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;

// ---------- Reviews ----------
export const ratingSchema = z.number().int().min(1).max(5);

export const createReviewSchema = z.object({
  listing_id: uuid,
  reviewee_id: uuid,
  rating: ratingSchema,
  body: z.string().max(2000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const replyToReviewSchema = z.object({
  review_id: uuid,
  reply_body: z.string().min(1).max(2000),
});
export type ReplyToReviewInput = z.infer<typeof replyToReviewSchema>;

// ---------- Boost / featured-listing payments ----------
export const boostTierIdSchema = z.enum(['b7', 'b30']);

export const createBoostOrderSchema = z.object({
  listing_id: uuid,
  tier: boostTierIdSchema,
});
export type CreateBoostOrderInput = z.infer<typeof createBoostOrderSchema>;

export const verifyBoostPaymentSchema = z.object({
  order_id: uuid,
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type VerifyBoostPaymentInput = z.infer<typeof verifyBoostPaymentSchema>;
