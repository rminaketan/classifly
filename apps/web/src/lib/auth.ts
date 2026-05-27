/**
 * Auth helpers for Server Components / Server Actions.
 */
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase/server';

/** Get the current authenticated user, or null. */
export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Get the current user + their profile row, or null. */
export async function getCurrentProfile() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return profile ? { user, profile } : { user, profile: null };
}

/** Require auth or redirect to login. */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : '';
    redirect(`/login${next}`);
  }
  return user;
}
