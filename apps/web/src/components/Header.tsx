import Link from 'next/link';
import { Search, MapPin, MessageCircle, PlusCircle, UserCircle, Languages } from 'lucide-react';
import { getCurrentProfile } from '@/lib/auth';

export async function Header() {
  const session = await getCurrentProfile();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center text-xl font-extrabold text-primary">
          Classifly<span className="text-accent">.in</span>
        </Link>

        <button className="btn-secondary !py-2 !text-xs" type="button">
          <MapPin className="h-4 w-4" /> Bengaluru
        </button>

        <form action="/search" className="relative mx-2 hidden flex-1 max-w-2xl md:block">
          <input
            name="q"
            className="input pl-10"
            placeholder="Search for cars, mobiles, jobs, services…"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button className="btn-secondary !py-2 !text-xs" type="button">
            <Languages className="h-4 w-4" /> EN
          </button>
          {user ? (
            <>
              <Link href="/chat" className="btn-secondary !p-2">
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link href="/profile" className="btn-secondary !p-2">
                <UserCircle className="h-5 w-5" />
              </Link>
              <Link href="/sell" className="btn-accent">
                <PlusCircle className="h-4 w-4" /> SELL
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Sign in
              </Link>
              <Link href="/login?intent=sell" className="btn-accent">
                <PlusCircle className="h-4 w-4" /> SELL
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
