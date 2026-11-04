import { ViewTransition } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteHeader />
      {/* Page changes cross-fade (and event photos morph between list and detail). */}
      <ViewTransition>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </ViewTransition>
      <SiteFooter />
    </>
  );
}
