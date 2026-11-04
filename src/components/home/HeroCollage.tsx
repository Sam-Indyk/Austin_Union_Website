import Image from 'next/image';
import { cacheLife, cacheTag } from 'next/cache';
import type { ReactNode } from 'react';
import { layoutCollage, type Tile } from '@/lib/collage-layout';
import type { CollagePhoto } from '@/lib/content/types';

// Frame shapes the mosaic is computed for. Desktop matches the Wix banner
// (1440×715); phones get their own arrangement with fewer, larger photos.
const DESKTOP_ASPECT = 1440 / 715;
const MOBILE_ASPECT = 390 / 640;
const MOBILE_MAX_PHOTOS = 12;

async function computeLayouts(photos: CollagePhoto[]) {
  'use cache';
  cacheLife('max');
  cacheTag('collage');
  const dims = photos.map((p) => ({ id: p.id, width: p.width, height: p.height }));
  return {
    desktop: layoutCollage(dims, DESKTOP_ASPECT),
    mobile: layoutCollage(dims.slice(0, MOBILE_MAX_PHOTOS), MOBILE_ASPECT),
  };
}

function Tiles({ tiles, photos, viewportWidth, variant }: { tiles: Tile[]; photos: Map<string, CollagePhoto>; viewportWidth: number; variant: 'desktop' | 'mobile' }) {
  return (
    <div className={`collage collage--${variant}`} aria-hidden="true">
      {tiles.map((t, i) => {
        const p = photos.get(t.id)!;
        // A small overlap hides sub-pixel seams between neighbouring tiles.
        return (
          <div
            key={t.id}
            className="collage__tile"
            style={{ left: `${t.left}%`, top: `${t.top}%`, width: `calc(${t.width}% + 1px)`, height: `calc(${t.height}% + 1px)` }}
          >
            <Image
              src={p.src}
              alt=""
              fill
              sizes={`${Math.ceil((t.width / 100) * viewportWidth)}px`}
              loading={i < 10 ? 'eager' : 'lazy'}
              style={{ objectPosition: `${p.focalX ?? 50}% ${p.focalY ?? 50}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** The black-and-white banner. Photos are arranged automatically; admins just add or remove them. */
export async function HeroCollage({ photos, children }: { photos: CollagePhoto[]; children?: ReactNode }) {
  const { desktop, mobile } = await computeLayouts(photos);
  const byId = new Map(photos.map((p) => [p.id, p]));
  return (
    <section className="hero" aria-label="Upcoming event">
      <Tiles tiles={desktop} photos={byId} viewportWidth={1440} variant="desktop" />
      <Tiles tiles={mobile} photos={byId} viewportWidth={390} variant="mobile" />
      {children}
    </section>
  );
}
