'use server';
/**
 * Server actions for the featured-listing (boost) flow.
 *
 *   createBoostOrder  → mints a Razorpay order + an `orders` row.
 *   verifyBoostPayment → verifies Razorpay's signature, marks the listing
 *                        featured, and writes the `payments` row.
 *
 * Both actions write through the service-role client because RLS on `orders`
 * and `payments` is SELECT-only (users must not be able to invent paid orders
 * or set their own listing as featured client-side).
 */
import { revalidatePath } from 'next/cache';
import {
  BOOST_TIERS,
  createBoostOrderSchema,
  verifyBoostPaymentSchema,
  type CreateBoostOrderInput,
  type VerifyBoostPaymentInput,
} from '@classifly/shared';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  isPaymentsMockMode,
} from '@/lib/razorpay';
import { env } from '@/lib/env';

export interface BoostOrderCreated {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amountPaise: number;
  isMock: boolean;
  tier: { id: string; label: string; durationDays: number; priceInr: number };
}

export async function createBoostOrder(
  input: CreateBoostOrderInput,
): Promise<BoostOrderCreated> {
  const parsed = createBoostOrderSchema.parse(input);

  const tier = BOOST_TIERS.find((t) => t.id === parsed.tier);
  if (!tier) throw new Error('Unknown boost tier');

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Ownership check uses the user-context client so RLS confirms the row is visible.
  const supabase = createSupabaseServerClient();
  const { data: listing, error: listErr } = await supabase
    .from('listings')
    .select('id, seller_id, status, title')
    .eq('id', parsed.listing_id)
    .single();
  if (listErr || !listing) throw new Error('Listing not found');
  if (listing.seller_id !== user.id) throw new Error('Not your listing');
  if (listing.status !== 'active') throw new Error('Listing must be active to boost');

  const rzpOrder = await createRazorpayOrder({
    amountInr: tier.priceInr,
    receipt: `boost_${parsed.listing_id.slice(0, 8)}_${Date.now()}`,
    notes: {
      listing_id: parsed.listing_id,
      tier: parsed.tier,
      duration_days: String(tier.durationDays),
    },
  });

  const admin = createSupabaseAdminClient();
  const { data: orderRow, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      type: 'featured_listing',
      reference_id: parsed.listing_id,
      amount: tier.priceInr,
      currency: 'INR',
      razorpay_order_id: rzpOrder.id,
      metadata: {
        tier: parsed.tier,
        duration_days: tier.durationDays,
        listing_title: listing.title,
      },
    })
    .select('id')
    .single();
  if (orderErr || !orderRow) {
    throw new Error(orderErr?.message ?? 'Failed to create order');
  }

  return {
    orderId: orderRow.id,
    razorpayOrderId: rzpOrder.id,
    razorpayKeyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amountPaise: rzpOrder.amount,
    isMock: isPaymentsMockMode(),
    tier: {
      id: tier.id,
      label: tier.label,
      durationDays: tier.durationDays,
      priceInr: tier.priceInr,
    },
  };
}

export interface BoostPaymentVerified {
  ok: true;
  alreadyPaid?: boolean;
  featuredUntil?: string;
}

export async function verifyBoostPayment(
  input: VerifyBoostPaymentInput,
): Promise<BoostPaymentVerified> {
  const parsed = verifyBoostPaymentSchema.parse(input);

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createSupabaseAdminClient();
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, user_id, type, reference_id, amount, razorpay_order_id, status, metadata')
    .eq('id', parsed.order_id)
    .single();
  if (orderErr || !order) throw new Error('Order not found');
  if (order.user_id !== user.id) throw new Error('Order does not belong to you');
  if (order.razorpay_order_id !== parsed.razorpay_order_id) {
    throw new Error('Razorpay order id mismatch');
  }
  if (order.status === 'paid') {
    return { ok: true, alreadyPaid: true };
  }

  const valid = verifyRazorpaySignature({
    razorpayOrderId: parsed.razorpay_order_id,
    razorpayPaymentId: parsed.razorpay_payment_id,
    signature: parsed.razorpay_signature,
  });
  if (!valid) throw new Error('Invalid signature');

  const meta = (order.metadata ?? {}) as { tier?: string; duration_days?: number };
  const tier = BOOST_TIERS.find((t) => t.id === meta.tier);
  if (!tier) throw new Error('Order metadata missing tier');
  if (!order.reference_id) throw new Error('Order has no listing reference');

  const featuredUntil = new Date(
    Date.now() + tier.durationDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // The Checkout `handler` callback doesn't surface the payment method;
  // default to upi here. A future webhook will reconcile from /payments/{id}.
  const { error: payErr } = await admin.from('payments').insert({
    order_id: order.id,
    method: 'upi',
    amount: order.amount,
    status: 'captured',
    razorpay_payment_id: parsed.razorpay_payment_id,
    captured_at: new Date().toISOString(),
  });
  if (payErr) throw new Error(`Failed to record payment: ${payErr.message}`);

  const { error: ordUpdErr } = await admin
    .from('orders')
    .update({ status: 'paid', completed_at: new Date().toISOString() })
    .eq('id', order.id);
  if (ordUpdErr) throw new Error(`Failed to update order: ${ordUpdErr.message}`);

  const { error: lstErr } = await admin
    .from('listings')
    .update({ is_featured: true, featured_until: featuredUntil })
    .eq('id', order.reference_id);
  if (lstErr) throw new Error(`Failed to mark listing featured: ${lstErr.message}`);

  revalidatePath(`/listings/${order.reference_id}`);
  revalidatePath('/');

  return { ok: true, featuredUntil };
}
