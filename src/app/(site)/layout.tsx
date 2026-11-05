import { Suspense, ViewTransition } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader, SiteHeaderWithPath } from '@/components/SiteHeader';
import { EditMode } from '@/components/edit/EditMode';

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
      {/* Officers only: the edit bar checks the session itself, so pages stay cached for everyone. */}
      <Suspense>
        <EditMode />
      </Suspense>
    </>
  );
}
