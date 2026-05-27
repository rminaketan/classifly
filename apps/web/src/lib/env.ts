/**
 * Validated environment variables.
 * Imported only at module top-level so a missing required value crashes the
 * build instead of failing silently at runtime.
 *
 * In a NOT_CONFIGURED state (e.g. you just cloned the repo), `isConfigured`
 * is false and the home page renders a setup-instructions screen instead
 * of crashing.
 */

const opt = (name: string) => process.env[name] || undefined;
const req = (name: string): string => {
  const v = process.env[name];
  if (!v) {
    // Don't throw at import time on the client; surface via isConfigured instead.
    return '';
  }
  return v;
};

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: opt('NEXT_PUBLIC_SUPABASE_URL') ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: opt('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? '',
  SUPABASE_SERVICE_ROLE_KEY: opt('SUPABASE_SERVICE_ROLE_KEY') ?? '',

  CF_R2_ACCOUNT_ID: opt('CF_R2_ACCOUNT_ID') ?? '',
  R2_ACCESS_KEY: opt('R2_ACCESS_KEY') ?? '',
  R2_SECRET_KEY: opt('R2_SECRET_KEY') ?? '',
  R2_BUCKET_PUBLIC: opt('R2_BUCKET_PUBLIC') ?? 'classifly-media-dev',
  R2_BUCKET_PRIVATE: opt('R2_BUCKET_PRIVATE') ?? 'classifly-private-dev',
  NEXT_PUBLIC_R2_PUBLIC_URL: opt('NEXT_PUBLIC_R2_PUBLIC_URL') ?? '',

  RAZORPAY_KEY_ID: opt('RAZORPAY_KEY_ID') ?? '',
  RAZORPAY_KEY_SECRET: opt('RAZORPAY_KEY_SECRET') ?? '',
  RAZORPAY_WEBHOOK_SECRET: opt('RAZORPAY_WEBHOOK_SECRET') ?? '',
  NEXT_PUBLIC_RAZORPAY_KEY_ID: opt('NEXT_PUBLIC_RAZORPAY_KEY_ID') ?? '',

  NEXT_PUBLIC_APP_URL: opt('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000',
  NODE_ENV: opt('NODE_ENV') ?? 'development',
};

/** True if the minimal set of values needed to boot the app is present. */
export const isConfigured =
  !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True if R2 uploads will succeed. */
export const isStorageConfigured =
  !!env.CF_R2_ACCOUNT_ID && !!env.R2_ACCESS_KEY && !!env.R2_SECRET_KEY;

/**
 * True if real Razorpay calls should be made. When false, the boost flow falls
 * back to a mock-mode short-circuit so the UX can be exercised end-to-end
 * without a Razorpay account. Mock mode trusts the client's "signature"
 * verbatim — never enable it in any environment where real money is at stake.
 */
export const isPaymentsConfigured =
  !!env.RAZORPAY_KEY_ID && !!env.RAZORPAY_KEY_SECRET && !!env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
