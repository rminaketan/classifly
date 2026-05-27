import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-2xl font-extrabold text-primary">
            Classifly<span className="text-accent">.in</span>
          </Link>
          <h1 className="mt-4 text-xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Sign in with your mobile number. We'll send you a 6-digit OTP.
          </p>
        </div>

        <div className="card p-6">
          <LoginForm next={searchParams.next} />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          By continuing you agree to the{' '}
          <Link href="/terms" className="underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
