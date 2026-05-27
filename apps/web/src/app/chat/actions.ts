'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendMessageSchema } from '@classifly/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Idempotently create-or-fetch a conversation between the current user (buyer)
 * and the listing's seller. Returns the conversation id.
 *
 * Safe to call repeatedly — guarded by the (listing_id, buyer_id, seller_id)
 * UNIQUE constraint on `conversations`.
 */
export async function startOrGetConversation(listingId: string): Promise<{
  id?: string;
  error?: string;
}> {
  const idParse = z.string().uuid().safeParse(listingId);
  if (!idParse.success) return { error: 'Invalid listing id' };

  const user = await getCurrentUser();
  if (!user) return { error: 'Please sign in' };

  const supabase = createSupabaseServerClient();

  // Fetch listing + verify it exists and isn't owned by the buyer
  const { data: listing, error: listingErr } = await supabase
    .from('listings')
    .select('id, seller_id, status')
    .eq('id', listingId)
    .single();

  if (listingErr || !listing) return { error: 'Listing not found' };
  if (listing.seller_id === user.id) return { error: 'You cannot chat with yourself' };

  // Look up existing
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .eq('seller_id', listing.seller_id)
    .maybeSingle();

  if (existing) return { id: existing.id };

  // Create
  const { data: created, error: insertErr } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
    })
    .select('id')
    .single();

  if (insertErr || !created) {
    // Race condition: another request just created the row. Re-query.
    const { data: again } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', listing.seller_id)
      .single();
    if (again) return { id: again.id };
    return { error: insertErr?.message ?? 'Could not start conversation' };
  }

  return { id: created.id };
}

/**
 * Send a text message in a conversation. RLS validates the sender is a
 * participant and that the conversation isn't blocked.
 */
export async function sendMessage(input: {
  conversation_id: string;
  body: string;
}): Promise<{ ok?: true; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Please sign in' };

  const parsed = sendMessageSchema.safeParse({
    conversation_id: input.conversation_id,
    type: 'text',
    body: input.body.trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid message' };
  }
  if (!parsed.data.body) return { error: 'Message is empty' };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('messages').insert({
    conversation_id: parsed.data.conversation_id,
    sender_id: user.id,
    type: 'text',
    body: parsed.data.body,
  });

  if (error) return { error: error.message };

  revalidatePath(`/chat/${parsed.data.conversation_id}`);
  return { ok: true };
}

/**
 * Mark a conversation's incoming messages as read for the current viewer.
 * Resets the corresponding unread counter on the `conversations` row.
 */
export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = createSupabaseServerClient();

  // Fetch the conv to know which side the viewer is on.
  const { data: conv } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single();
  if (!conv) return;

  const isBuyer = conv.buyer_id === user.id;
  if (!isBuyer && conv.seller_id !== user.id) return;

  // 1) Set read_at on inbound messages
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null);

  // 2) Reset unread counter
  const patch = isBuyer ? { buyer_unread: 0 } : { seller_unread: 0 };
  await supabase.from('conversations').update(patch).eq('id', conversationId);
}
