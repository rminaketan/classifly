import Link from 'next/link';
import { redirect } from 'next/navigation';
import { VerifyForm } from './VerifyForm';

export const metadata = { title: 'Verify OTP' };

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { phone?: string; next?: string };
}) {
  if (!searchParams.phone) redirect('/login');

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-2xl font-extrabold text-primary">
            Classifly<span className="text-accent">.in</span>
          </Link>
          <h1 className="mt-4 text-xl font-bold">Enter the 6-digit OTP</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Sent to <span className="font-semibold">{searchParams.phone}</span>
          </p>
        </div>

        <div className="card p-6">
          <VerifyForm phone={searchParams.phone} next={searchParams.next} />
        </div>

        <Link
          href={`/login${searchParams.next ? `?next=${searchParams.next}` : ''}`}
          className="mt-6 block text-center text-sm text-primary underline"
        >
          ← Use a different number
        </Link>
      </div>
    </main>
  );
}
