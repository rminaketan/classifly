/**
 * Shown when the app boots without Supabase configured.
 * Helpful first-run UX so you see something instead of a 500.
 */
export function SetupScreen() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <div className="text-4xl font-extrabold text-primary">
          Classifly<span className="text-accent">.in</span>
        </div>
        <p className="mt-2 text-neutral-600">India's next-generation marketplace</p>
      </div>

      <div className="card mt-10 p-6">
        <h1 className="text-xl font-bold">Welcome — finish setup to continue</h1>
        <p className="mt-2 text-sm text-neutral-600">
          The app is running, but your Supabase environment isn't configured yet. Follow these steps:
        </p>

        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm">
          <li>
            Open <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">SETUP.md</code>{' '}
            in the project root.
          </li>
          <li>
            Create a free Supabase project at{' '}
            <a className="text-primary underline" href="https://supabase.com">
              supabase.com
            </a>{' '}
            and run the migrations (or use <code>pnpm db:start</code> locally).
          </li>
          <li>
            Copy <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">.env.example</code> to{' '}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">.env.local</code> in the project root and fill in:
            <pre className="mt-2 overflow-x-auto rounded-md bg-neutral-900 p-3 text-xs text-neutral-100">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...`}
            </pre>
          </li>
          <li>Restart <code>pnpm dev</code>.</li>
        </ol>

        <div className="mt-6 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <strong>Free for Year 1.</strong> Every component in the lean stack
          (Supabase, Cloudflare R2 + Pages, Upstash, Sentry, Resend) has a free tier that
          covers our first 25–50K MAU. See{' '}
          <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono">
            docs/01-architecture/Lean_Bootstrap_Architecture.md
          </code>
          .
        </div>
      </div>
    </main>
  );
}
