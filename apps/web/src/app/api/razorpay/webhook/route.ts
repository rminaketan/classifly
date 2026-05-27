/**
 * Razorpay webhook receiver.
 *
 * Razorpay POSTs payment lifecycle events here with a signed JSON body.
 * The webhook is the authoritative path for marking orders paid + flipping
 * `listings.is_featured` — the verifyBoostPayment server action handles the
 * happy path for immediate UX feedback, but if the user closes the tab
 * before the redirect fires, this is what guarantees the listing still
 * becomes featured.
 *
 * The HMAC is computed over the raw request bytes, so this route must read
 * `req.text()` and never `req.json()`. Re-serialising parsed JSON would
 * yield a different byte sequence than what Razorpay signed.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { BOOST_TIERS } from '@classifly/shared';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  error_description?: string;
}

interface RazorpayWebhookEvent {
  event: string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
    order?: { entity: { id: string } };
  };
}

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi' | 'bank_transfer';
const ALLOWED_METHODS: readonly PaymentMethod[] = [
  'upi', 'card', 'netbanking', 'wallet', 'emi', 'bank_transfer',
];

function normaliseMethod(m: string | undefined): PaymentMethod {
  return (m && (ALLOWED_METHODS as readonly string[]).includes(m)) ? (m as PaymentMethod) : 'upi';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }
  if (!verifyRazorpayWebhookSignature({ rawBody, signature })) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let evt: RazorpayWebhookEvent;
  try {
    evt = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const payment = evt.payload.payment?.entity;

  switch (evt.event) {
    case 'payment.captured': {
      if (!payment) return NextResponse.json({ ok: true });

      const { data: order } = await admin
        .from('orders')
        .select('id, reference_id, metadata, status')
        .eq('razorpay_order_id', payment.order_id)
        .single();
      if (!order) {
        // Unknown order — ack to stop Razorpay's retry loop, surface in logs.
        console.warn(`[razorpay webhook] unknown order ${payment.order_id}`);
        return NextResponse.json({ ok: true, note: 'unknown order' });
      }

      // Upsert the payment row. The verifyBoostPayment action may have
      // already inserted with method='upi' default — this reconciles to the
      // real method from Razorpay.
      await admin
        .from('payments')
        .upsert(
          {
            order_id: order.id,
            razorpay_payment_id: payment.id,
            method: normaliseMethod(payment.method),
            amount: payment.amount / 100,
            status: 'captured',
            captured_at: new Date().toISOString(),
          },
          { onConflict: 'razorpay_payment_id' },
        );

      if (order.status !== 'paid') {
        await admin
          .from('orders')
          .update({ status: 'paid', completed_at: new Date().toISOString() })
          .eq('id', order.id);
      }

      if (order.reference_id) {
        const meta = (order.metadata ?? {}) as { tier?: string };
        const tier = BOOST_TIERS.find((t) => t.id === meta.tier);
        if (tier) {
          const featuredUntil = new Date(
            Date.now() + tier.durationDays * 86_400_000,
          ).toISOString();
          await admin
            .from('listings')
            .update({ is_featured: true, featured_until: featuredUntil })
            .eq('id', order.reference_id);
        }
      }

      return NextResponse.json({ ok: true });
    }

    case 'payment.failed': {
      if (!payment) return NextResponse.json({ ok: true });

      const { data: order } = await admin
        .from('orders')
        .select('id, status')
        .eq('razorpay_order_id', payment.order_id)
        .single();
      if (!order) {
        console.warn(`[razorpay webhook] unknown order ${payment.order_id}`);
        return NextResponse.json({ ok: true, note: 'unknown order' });
      }

      await admin.from('payments').upsert(
        {
          order_id: order.id,
          razorpay_payment_id: payment.id,
          method: normaliseMethod(payment.method),
          amount: payment.amount / 100,
          status: 'failed',
          failure_reason: payment.error_description ?? null,
        },
        { onConflict: 'razorpay_payment_id' },
      );

      if (order.status === 'created') {
        await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
      }
      return NextResponse.json({ ok: true });
    }

    default:
      // order.paid + any other event — ack to prevent retries.
      return NextResponse.json({ ok: true, note: `unhandled event: ${evt.event}` });
  }
}
