'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

export const NAV = [
  { href: '/', label: 'HOME' },
  { href: '/events', label: 'EVENTS' },
  { href: '/mission', label: 'MISSION' },
  { href: '/team', label: 'TEAM' },
  { href: '/contact', label: 'CONTACT' },
  { href: '/donate', label: 'DONATE' },
];

// Supabase keeps the session in cookies named sb-<project>-auth-token (possibly
// chunked as .0, .1). Checking for one in the browser decides LOGIN vs ACCOUNT
// without making every public page render per-visitor on the server.
const hasSession = () => /(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie);

// Re-check right after mount (the server can't know) and whenever the tab
// regains focus (e.g. after signing in or out in another tab).
function subscribe(onChange: () => void) {
  const t = setTimeout(onChange, 0);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onChange);
  return () => {
    clearTimeout(t);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onChange);
  };
}

/** null until the browser has checked (the server can't know who's visiting). */
function useSignedIn(): boolean | null {
  return useSyncExternalStore(subscribe, hasSession, () => null);
}

/** Reads the current path; rendered inside <Suspense> so pages with unknown URLs still prerender. */
export function SiteHeaderWithPath() {
  return <SiteHeader pathname={usePathname()} />;
}

export function SiteHeader({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const signedIn = useSignedIn();
  const current = (href: string) =>
    pathname && (pathname === href || (href !== '/' && pathname.startsWith(href + '/'))) ? ('page' as const) : undefined;
  // Until we know, the last item keeps its space but stays invisible, so it never flashes the wrong word.
  const account = signedIn ? { href: '/account', label: 'ACCOUNT' } : { href: '/login', label: 'LOGIN' };
  const items = [...NAV, account];
  const pending = (href: string) => (signedIn === null && href === account.href ? 'is-pending' : undefined);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to Main Content
      </a>
      <nav className="site-nav" aria-label="Site">
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item.href)} className={pending(item.href)}>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link href="/" className="site-header__seal" aria-label="Austin Union home">
        <Image src="/media/site/seal.png" alt="" width={48} height={48} />
      </Link>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav id="mobile-menu" className="mobile-menu" hidden={!open} aria-label="Site">
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item.href)} className={pending(item.href)} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
