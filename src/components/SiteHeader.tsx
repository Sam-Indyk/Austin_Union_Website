'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export const NAV = [
  { href: '/', label: 'HOME' },
  { href: '/events-1', label: 'EVENTS' },
  { href: '/about-4', label: 'MISSION' },
  { href: '/team', label: 'TEAM' },
  { href: '/contact-8', label: 'CONTACT' },
  { href: '/donate', label: 'DONATE' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = (href: string) => (pathname === href ? 'page' : undefined);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to Main Content
      </a>
      <nav className="site-nav" aria-label="Site">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item.href)}>
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
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item.href)} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
