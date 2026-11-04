import { Suspense, ViewTransition } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader, SiteHeaderWithPath } from '@/components/SiteHeader';

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      {/* The fallback is the same header without the active-page highlight. */}
      <Suspense fallback={<SiteHeader pathname={null} />}>
        <SiteHeaderWithPath />
      </Suspense>
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
