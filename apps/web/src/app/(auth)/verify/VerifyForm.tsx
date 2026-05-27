'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOtpSchema } from '@classifly/shared';
import { verifyOtpAction, sendOtpAction } from '../login/actions';

export function VerifyForm({ phone, next }: { phone: string; next?: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = verifyOtpSchema.safeParse({ phone, code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid OTP');
      return;
    }
    startTransition(async () => {
      const result = await verifyOtpAction(parsed.data);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(next ?? '/');
      router.refresh();
    });
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    const r = await sendOtpAction({ phone });
    if (r.error) setError(r.error);
    else setInfo('New OTP sent.');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">
          One-time password
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="input mt-1.5 text-center text-2xl font-bold tracking-[0.4em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
        />
        <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500">
          <span>Valid for 5 minutes</span>
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-primary"
            disabled={pending}
          >
            Resend
          </button>
        </div>
      </div>

      {info && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {info}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending || code.length !== 6}>
        {pending ? 'Verifying…' : 'Verify and sign in'}
      </button>
    </form>
  );
}
