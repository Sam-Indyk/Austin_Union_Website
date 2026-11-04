import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { Suspense } from 'react';
import { PresentClient } from '@/components/votes/PresentClient';
import { loadVote, publicState } from '@/lib/votes/server';

export const metadata: Metadata = { title: 'Vote · Presentation', robots: { index: false } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';

async function Present({ params }: Pick<PageProps<'/vote/[slug]/present'>, 'params'>) {
  const { slug } = await params;
  const vote = await loadVote({ slug });
  if (!vote || vote.phase === 'draft') notFound();
  const joinUrl = `${SITE}/vote/${vote.slug}`;
  const qr = await QRCode.toString(joinUrl, { type: 'svg', margin: 1, color: { dark: '#2f2e2e', light: '#ffffff' } });
  // The projector shows exactly what the public may see (plus the running turnout).
  const state = await publicState(vote, null);
  return <PresentClient initial={state} qrSvg={qr} joinUrl={joinUrl.replace(/^https?:\/\//, '')} />;
}

export default function PresentPage({ params }: PageProps<'/vote/[slug]/present'>) {
  return (
    <Suspense fallback={<div className="present" />}>
      <Present params={params} />
    </Suspense>
  );
}
