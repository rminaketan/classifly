'use server';

import { revalidatePath } from 'next/cache';
import { createListingSchema, type CreateListingInput, DEFAULT_LISTING_EXPIRY_DAYS } from '@classifly/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export async function createListingAction(input: CreateListingInput) {
  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const user = await getCurrentUser();
  if (!user) return { error: 'Please sign in' };

  const supabase = createSupabaseServerClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEFAULT_LISTING_EXPIRY_DAYS * 86_400_000);

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      category_id: parsed.data.category_id,
      vertical: parsed.data.vertical,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      price: parsed.data.price ?? null,
      price_type: parsed.data.price_type,
      condition: parsed.data.condition ?? null,
      city_id: parsed.data.city_id ?? null,
      locality_id: parsed.data.locality_id ?? null,
      address: parsed.data.address ?? null,
      language: parsed.data.language,
      status: 'active', // tier-0 free flow; would be 'pending_review' once moderation is on
      posted_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: error?.message ?? 'Could not create listing' };
  }

  // Persist category-specific attrs in the side table (kept narrow on listings).
  if (Object.keys(parsed.data.attrs).length > 0) {
    await supabase.from('listing_attributes').insert({
      listing_id: data.id,
      attrs: parsed.data.attrs as any,
    });
  }

  revalidatePath('/');
  revalidatePath('/profile');
  return { id: data.id };
}
