import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UPLOAD_LIMITS } from '@classifly/shared';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteObject } from '@/lib/r2';
import { env } from '@/lib/env';

/**
 * POST /api/listings/[id]/media
 *
 * Body: { key, width?, height?, blurhash? }
 *
 * Registers an R2-uploaded object as a media row on the listing.
 * The R2 key was minted by /api/upload-url with the listing's id baked in.
 */
const registerSchema = z.object({
  key: z.string().min(1).max(500),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurhash: z.string().max(50).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'invalid input' },
      { status: 400 },
    );
  }

  // Key must be under this listing's prefix — prevents one user attaching
  // someone else's uploaded object to their listing.
  const expectedPrefix = `listings/${params.id}/`;
  if (!parsed.data.key.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: 'key does not match this listing' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Verify the caller actually owns the listing (RLS would catch it too, but
  // we want a clean 403 instead of a confusing 401).
  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id')
    .eq('id', params.id)
    .single();

  if (!listing) return NextResponse.json({ error: 'listing not found' }, { status: 404 });
  if (listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'not your listing' }, { status: 403 });
  }

  // Enforce max-images-per-listing at insert time (DB has no count constraint).
  const { count } = await supabase
    .from('listing_media')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', params.id);
  if ((count ?? 0) >= UPLOAD_LIMITS.maxImagesPerListing) {
    return NextResponse.json(
      { error: `Maximum ${UPLOAD_LIMITS.maxImagesPerListing} photos per listing` },
      { status: 409 },
    );
  }

  const url = `${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${parsed.data.key}`;

  const { data, error } = await supabase
    .from('listing_media')
    .insert({
      listing_id: params.id,
      type: 'image',
      url,
      width: parsed.data.width ?? null,
      height: parsed.data.height ?? null,
      blurhash: parsed.data.blurhash ?? null,
      sort_order: count ?? 0,
    })
    .select('id, url, sort_order, width, height')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'failed to register' }, { status: 500 });
  }

  return NextResponse.json({ media: data });
}

/**
 * DELETE /api/listings/[id]/media?mediaId=<uuid>
 *
 * Removes a media row and deletes the underlying R2 object.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const mediaId = new URL(req.url).searchParams.get('mediaId');
  if (!mediaId) return NextResponse.json({ error: 'mediaId required' }, { status: 400 });

  const supabase = createSupabaseServerClient();

  const { data: row } = await supabase
    .from('listing_media')
    .select('id, listing_id, url, listings:listings!listing_media_listing_id_fkey(seller_id)')
    .eq('id', mediaId)
    .single();

  if (!row || (row as any).listing_id !== params.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (((row as any).listings?.seller_id ?? null) !== user.id) {
    return NextResponse.json({ error: 'not your listing' }, { status: 403 });
  }

  // Delete the DB row first; if R2 delete fails afterwards we'll have an
  // orphan object (cleanup job picks it up later).
  const { error: dbErr } = await supabase.from('listing_media').delete().eq('id', mediaId);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Strip the public-URL prefix to get the R2 key.
  const prefix = `${env.NEXT_PUBLIC_R2_PUBLIC_URL}/`;
  const key = (row as any).url.startsWith(prefix)
    ? (row as any).url.slice(prefix.length)
    : null;
  if (key) {
    try {
      await deleteObject('public', key);
    } catch (e) {
      console.error('R2 delete failed (orphan left)', { mediaId, key, e });
    }
  }

  return NextResponse.json({ ok: true });
}
