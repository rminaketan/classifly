import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, ShieldAlert } from 'lucide-react';
import { Header } from '@/components/Header';
import { SetupScreen } from '@/components/SetupScreen';
import { isConfigured } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatINR } from '@classifly/shared';
import { ChatThread } from './ChatThread';

export const metadata = { title: 'Chat' };
export const dynamic = 'force-dynamic';

export default async function ChatThreadPage({ params }: { params: { id: string } }) {
  if (!isConfigured) return <SetupScreen />;
  const user = await requireUser(`/chat/${params.id}`);

  const supabase = createSupabaseServerClient();

  const { data: conv } = await supabase
    .from('conversations')
    .select(
      `id, listing_id, buyer_id, seller_id, is_blocked,
       listing:listings(id, title, price, status,
                        media:listing_media(url, sort_order),
                        city:cities(name)),
       buyer:profiles!conversations_buyer_id_fkey(id, display_name, kyc_tier),
       seller:profiles!conversations_seller_id_fkey(id, display_name, kyc_tier)`,
    )
    .eq('id', params.id)
    .single();

  if (!conv) notFound();
  const isBuyer = conv.buyer_id === user.id;
  const isParticipant = isBuyer || conv.seller_id === user.id;
  if (!isParticipant) notFound();

  const other = isBuyer ? (conv.seller as any) : (conv.buyer as any);
  const listing = conv.listing as any;
  const coverUrl =
    listing?.media?.slice().sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.url ??
    null;

  // Fetch latest 50 messages. ChatThread will paginate older ones on scroll.
  const { data: initialMessages } = await supabase
    .from('messages')
    .select('id, sender_id, body, type, created_at, read_at')
    .eq('conversation_id', params.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(50);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-4">
        <Link
          href="/chat"
          className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All chats
        </Link>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Thread */}
          <div className="card flex h-[calc(100vh-180px)] min-h-[500px] flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-neutral-200 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {(other?.display_name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {other?.display_name ?? 'User'}
                  {other?.kyc_tier && other.kyc_tier !== 'tier0' && (
                    <span className="badge-kyc">
                      <BadgeCheck className="h-3 w-3" /> KYC
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500">
                  {isBuyer ? 'Seller' : 'Buyer'} on this listing
                </div>
              </div>
            </div>

            <ChatThread
              conversationId={conv.id}
              currentUserId={user.id}
              initialMessages={(initialMessages ?? []) as any}
              isBlocked={conv.is_blocked}
            />
          </div>

          {/* Right rail: listing context */}
          <aside className="space-y-3">
            <div className="card overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-neutral-500 to-neutral-800">
                {coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="text-lg font-bold text-primary">{formatINR(listing?.price)}</div>
                <div className="line-clamp-2 text-sm font-semibold">{listing?.title ?? '—'}</div>
                {listing?.city && (
                  <div className="mt-1 text-xs text-neutral-500">{listing.city.name}</div>
                )}
                {listing?.status === 'sold' && (
                  <div className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                    Sold
                  </div>
                )}
                {listing?.id && (
                  <Link
                    href={`/listings/${listing.id}`}
                    className="btn-secondary mt-3 w-full !py-1.5 !text-xs"
                  >
                    View listing
                  </Link>
                )}
              </div>
            </div>

            <div className="card border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Phone privacy on</div>
                  <div className="mt-1">
                    {other?.display_name ?? 'They'} cannot see your number. You can reveal it via
                    a masked Classifly proxy at any time.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
