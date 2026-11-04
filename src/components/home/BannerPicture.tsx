'use client';

import { useCallback, useState, type ImgHTMLAttributes } from 'react';

/** The banner <picture>; fades in over the blurred preview once the image has decoded. */
export function BannerPicture({ mobileSrcSet, desktop }: { mobileSrcSet: string; desktop: ImgHTMLAttributes<HTMLImageElement> }) {
  const [loaded, setLoaded] = useState(false);
  // Catches images that finished loading before React hydrated (onLoad would never fire).
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <picture>
      <source media="(max-width: 760px)" srcSet={mobileSrcSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...desktop} ref={ref} className={`hero__img${loaded ? ' is-loaded' : ''}`} onLoad={() => setLoaded(true)} decoding="async" />
    </picture>
  );
}
