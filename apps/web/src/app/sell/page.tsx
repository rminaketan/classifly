import { Header } from '@/components/Header';
import { SetupScreen } from '@/components/SetupScreen';
import { isConfigured } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PostAdForm } from './PostAdForm';

export const metadata = { title: 'Sell something' };

export default async function SellPage() {
  if (!isConfigured) return <SetupScreen />;

  await requireUser('/sell');
  const supabase = createSupabaseServerClient();

  const [{ data: categories }, { data: cities }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, slug, name, vertical, parent_id, depth, is_leaf')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase.from('cities').select('id, name, state').order('population', { ascending: false }).limit(50),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Post your ad</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Free for personal listings. Listings expire after 60 days.
        </p>
        <PostAdForm categories={categories ?? []} cities={cities ?? []} />
      </main>
    </>
  );
}
