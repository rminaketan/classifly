/**
 * Razorpay helper — mints orders against the live REST API, verifies the
 * signature returned by Checkout, and falls back to a mock mode when keys
 * aren't configured so the UX can be developed without a Razorpay account.
 */
import crypto from 'node:crypto';
import { env, isPaymentsConfigured } from './env';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export function isPaymentsMockMode(): boolean {
  return !isPaymentsConfigured;
}

export async function createRazorpayOrder(opts: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const amountPaise = Math.round(opts.amountInr * 100);

  if (isPaymentsMockMode()) {
    return {
      id: `mock_order_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      amount: amountPaise,
      currency: 'INR',
      receipt: opts.receipt,
      status: 'created',
    };
  }

  const resp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' +
        Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64'),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: opts.receipt,
      notes: opts.notes,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Razorpay create order failed (${resp.status}): ${body}`);
  }
  return (await resp.json()) as RazorpayOrder;
}

export function verifyRazorpaySignature(opts: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  if (isPaymentsMockMode()) {
    return opts.signature.startsWith('mock_sig_');
  }
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${opts.razorpayOrderId}|${opts.razorpayPaymentId}`)
    .digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(opts.signature, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verify a Razorpay webhook signature. The HMAC is computed over the *raw*
 * request body using a dashboard-configured webhook secret (distinct from the
 * key secret used for payment-redirect verification).
 *
 * In mock mode the function accepts the literal string `mock_webhook_sig`
 * as the signature so the webhook can be exercised end-to-end without a
 * Razorpay account.
 */
export function verifyRazorpayWebhookSignature(opts: {
  rawBody: string;
  signature: string;
}): boolean {
  if (isPaymentsMockMode()) {
    return opts.signature === 'mock_webhook_sig';
  }
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(opts.rawBody)
    .digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(opts.signature, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
