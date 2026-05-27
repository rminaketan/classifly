'use client';
/**
 * Owner-only CTA on the listing detail page that opens a tier picker, mints a
 * Razorpay order via the server action, then either:
 *   - opens Razorpay Checkout (real mode), or
 *   - calls verifyBoostPayment directly with a mock signature (mock mode).
 */
import { useState } from 'react';
import { Zap } from 'lucide-react';
import { BOOST_TIERS, type BoostTierId } from '@classifly/shared';
import {
  createBoostOrder,
  verifyBoostPayment,
} from '@/app/listings/[id]/boost-actions';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (resp: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

async function ensureRazorpayLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = RAZORPAY_SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

interface Props {
  listingId: string;
}

export function BoostButton({ listingId }: Props) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<BoostTierId>('b7');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handlePay() {
    setError(null);
    setBusy(true);
    try {
      const created = await createBoostOrder({ listing_id: listingId, tier });

      if (created.isMock) {
        const result = await verifyBoostPayment({
          order_id: created.orderId,
          razorpay_order_id: created.razorpayOrderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: `mock_sig_${created.razorpayOrderId}`,
        });
        if (result.ok) setDone(true);
        return;
      }

      const loaded = await ensureRazorpayLoaded();
      if (!loaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay Checkout');
      }
      const rzp = new window.Razorpay({
        key: created.razorpayKeyId,
        amount: created.amountPaise,
        currency: 'INR',
        order_id: created.razorpayOrderId,
        name: 'Classifly',
        description: `${created.tier.label} featured boost`,
        handler: async (resp) => {
          try {
            await verifyBoostPayment({
              order_id: created.orderId,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setDone(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Payment verification failed');
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: '#2563eb' },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start boost');
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-center text-sm font-semibold text-green-900">
        ✓ Your listing is now featured. Refresh to see the badge.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn-secondary mt-3 w-full"
        onClick={() => setOpen(true)}
      >
        <Zap className="h-4 w-4" /> Boost this listing
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-primary-200 bg-primary-50/60 p-3 text-sm">
      <div className="font-semibold text-primary-900">Pick a boost plan</div>
      <div className="space-y-2">
        {BOOST_TIERS.map((t) => (
          <label
            key={t.id}
            className={`flex cursor-pointer items-center justify-between rounded-md border bg-white p-2 ${
              tier === t.id ? 'border-primary' : 'border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="boost-tier"
                value={t.id}
                checked={tier === t.id}
                onChange={() => setTier(t.id)}
                disabled={busy}
              />
              <div>
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-neutral-500">{t.tagline}</div>
              </div>
            </div>
            <div className="font-bold">₹{t.priceInr}</div>
          </label>
        ))}
      </div>
      {error && (
        <div className="rounded bg-red-50 p-2 text-xs text-red-800">{error}</div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={handlePay}
          disabled={busy}
        >
          {busy ? 'Processing…' : 'Pay & boost'}
        </button>
      </div>
    </div>
  );
}
