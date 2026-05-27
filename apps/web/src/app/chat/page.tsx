import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageCircle, BadgeCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { SetupScreen } from '@/components/SetupScreen';
import { isConfigured } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { timeAgo } from '@classifly/shared';
import { startOrGetConversation } from './actions';

export const metadata = { title: 'Chats' };

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: { listing?: string };
}) {
  if (!isConfigured) return <SetupScreen />;
  const returnTo = searchParams.listing ? `/chat?listing=${searchParams.listing}` : '/chat';
  const user = await requireUser(returnTo);

  // If we landed here from a "Chat with seller" click, upsert a conversation
  // for the given listing and redirect into the thread.
  if (searchParams.listing) {
    const result = await startOrGetConversation(searchParams.listing);
    if (result.id) redirect(`/chat/${result.id}`);
    // Fall through and show the list with an inline error.
  }

  const supabase = createSupabaseServerClient();
  const { data: convs } = await supabase
    .from('conversations')
    .select(
      `id, last_message_at, last_message_preview, buyer_unread, seller_unread, buyer_id, seller_id,
       listing:listings(id, title, price, status),
       buyer:profiles!conversations_buyer_id_fkey(id, display_name),
       seller:profiles!conversations_seller_id_fkey(id, display_name, kyc_tier)`,
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const rows = (convs ?? []) as any[];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Chats</h1>
        <p className="mb-5 text-sm text-neutral-500">
          {rows.length === 0
            ? 'No conversations yet. Start one by clicking "Chat with seller" on a listing.'
            : `${rows.length} active conversation${rows.length === 1 ? '' : 's'}`}
        </p>

        {searchParams.listing && rows.length === 0 && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            Could not start that conversation. The listing may have been removed, or you may be
            the seller.
          </div>
        )}

        <div className="card divide-y divide-neutral-200">
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            rows.map((c) => {
              const isBuyer = c.buyer_id === user.id;
              const other = isBuyer ? c.seller : c.buyer;
              const unread = isBuyer ? c.buyer_unread : c.seller_unread;
              return (
                <Link
                  key={c.id}
                  href={`/chat/${c.id}`}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
                    {(other?.display_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold">{other?.display_name ?? 'Unnamed'}</span>
                        {!isBuyer && c.seller?.kyc_tier !== 'tier0' && (
                          <BadgeCheck className="h-3.5 w-3.5 text-sky-600" aria-label="KYC verified" />
                        )}
                      </div>
                      <span className="flex-shrink-0 text-xs text-neutral-500">
                        {c.last_message_at ? timeAgo(c.last_message_at) : '—'}
                      </span>
                    </div>
                    <div className="truncate text-xs text-neutral-500">
                      {c.listing?.title ?? 'Listing removed'}
                    </div>
                    <div className="truncate text-sm text-neutral-700">
                      {c.last_message_preview ?? 'Say hello…'}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="self-center rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
        <MessageCircle className="h-7 w-7" />
      </div>
      <h3 className="mt-3 font-bold">No chats yet</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-600">
        When you message a seller or someone messages you about your listing, it shows up here.
      </p>
      <Link href="/" className="btn-primary mt-4">
        Browse listings
      </Link>
    </div>
  );
}
