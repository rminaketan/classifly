/**
 * Browser Supabase client. Use in Client Components and 'use client' contexts.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@classifly/db';
import { env } from '../env';

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
