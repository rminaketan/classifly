import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const idSchema = z.object({ listingId: z.string().uuid() });

/**
 * POST /api/saved-listings  body: { listingId }
 * Save a listing for the current user. Idempotent.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = idSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid listingId' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_listings')
    .upsert(
      { user_id: user.id, listing_id: parsed.data.listingId },
      { onConflict: 'user_id,listing_id', ignoreDuplicates: true },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // listings.save_count is maintained by trg_listings_save_count on the DB side.

  return NextResponse.json({ saved: true });
}

/**
 * DELETE /api/saved-listings?listingId=<uuid>
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const listingId = new URL(req.url).searchParams.get('listingId');
  const parsed = idSchema.safeParse({ listingId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid listingId' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', parsed.data.listingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ saved: false });
}
