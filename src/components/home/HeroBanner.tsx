import { getImageProps } from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import type { CollageBanner } from '@/lib/content/types';
import { BannerPicture } from './BannerPicture';

/**
 * The black-and-white banner. Its photos are composed into one image whenever
 * they change (see lib/collage-render.ts), so the banner arrives in one piece:
 * a blurred preview immediately, then the full picture fades in.
 */
export function HeroBanner({ banner, children }: { banner: CollageBanner; children?: ReactNode }) {
  const common = { alt: '', sizes: '100vw', quality: 70 };
  const { props: desktop } = getImageProps({
    ...common,
    src: banner.desktop.src,
    width: banner.desktop.width,
    height: banner.desktop.height,
    loading: 'eager',
    fetchPriority: 'high',
  });
  const { props: mobile } = getImageProps({ ...common, src: banner.mobile.src, width: banner.mobile.width, height: banner.mobile.height });

  const style = {
    '--blur-desktop': `url("${banner.desktop.blurDataURL}")`,
    '--blur-mobile': `url("${banner.mobile.blurDataURL}")`,
  } as CSSProperties;

  return (
    <section className="hero" aria-label="Upcoming event" style={style} data-edit="collage" data-edit-label="Banner photos">
      <div className="hero__blur" aria-hidden="true" />
      <BannerPicture mobileSrcSet={mobile.srcSet!} desktop={desktop} />
      {children}
    </section>
  );
}
