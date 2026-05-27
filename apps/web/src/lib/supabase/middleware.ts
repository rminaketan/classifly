/**
 * Supabase middleware client — refreshes the auth session on every request.
 * Called from src/middleware.ts.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@classifly/db';
import { env, isConfigured } from '../env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isConfigured) return response; // skip if env not set up yet

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // This call refreshes the session if it's expired.
  await supabase.auth.getUser();

  return response;
}
