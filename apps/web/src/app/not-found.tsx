import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl font-extrabold text-primary">404</div>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-neutral-600">This page doesn't exist or has been removed.</p>
      <Link href="/" className="btn-primary mt-6">
        Go home
      </Link>
    </main>
  );
}
