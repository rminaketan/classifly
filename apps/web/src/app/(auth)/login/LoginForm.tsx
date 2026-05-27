'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';
import { signInWithPhoneSchema } from '@classifly/shared';
import { sendOtpAction } from './actions';

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = signInWithPhoneSchema.safeParse({ phone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid phone number');
      return;
    }
    startTransition(async () => {
      const result = await sendOtpAction(parsed.data);
      if (result.error) {
        setError(result.error);
        return;
      }
      const params = new URLSearchParams({ phone: parsed.data.phone });
      if (next) params.set('next', next);
      router.push(`/verify?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="phone">
          Mobile number
        </label>
        <div className="relative mt-1.5">
          <input
            id="phone"
            type="tel"
            className="input pl-10"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            inputMode="tel"
            required
          />
          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          Include country code (+91 for India). We'll text you a one-time code.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? 'Sending OTP…' : 'Send OTP'}
      </button>
    </form>
  );
}
