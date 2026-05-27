'use server';

import { signInWithPhoneSchema, verifyOtpSchema } from '@classifly/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function sendOtpAction(input: { phone: string }) {
  const parsed = signInWithPhoneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.data.phone,
    options: { channel: 'sms' },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function verifyOtpAction(input: { phone: string; code: string }) {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.code,
    type: 'sms',
  });
  if (error) return { error: error.message };
  return { ok: true };
}
