import Link from 'next/link';
import { Header } from '@/components/Header';

export default function ListingNotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="mt-3 text-2xl font-bold">This listing is no longer available</h1>
        <p className="mt-2 text-neutral-600">
          It may have been sold, removed by the seller, or expired.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Browse similar
        </Link>
      </main>
    </>
  );
}
