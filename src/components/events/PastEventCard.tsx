'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, ViewTransition } from 'react';

export interface PastCardData {
  slug: string;
  title: string;
  summary: string;
  dayLabel: string;
  locationName: string;
  image: { src: string; alt: string; focalX?: number; focalY?: number; blurDataURL?: string };
  buttonLabel: string;
}

export function PastEventCard({ e }: { e: PastCardData }) {
  const [open, setOpen] = useState(false);
  const href = `/events/${e.slug}`;
  return (
    <li className="past-card">
      <ViewTransition name={`event-image-${e.slug}`} share="morph" default="none">
        <Link href={href} className="past-card__image" tabIndex={-1} aria-hidden="true">
          <Image
            src={e.image.src}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 298px"
            style={{ objectPosition: `${e.image.focalX ?? 50}% ${e.image.focalY ?? 50}%` }}
            {...(e.image.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: e.image.blurDataURL } : {})}
          />
        </Link>
      </ViewTransition>
      <div className="past-card__body">
        <Link href={href} className="past-card__title" title={e.title}>
          {e.title}
        </Link>
        <p className="past-card__meta">
          {e.dayLabel}
          <span className="sep">|</span>
          {e.locationName}
        </p>
        <button type="button" className="past-card__more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Less info' : 'More info'}
        </button>
        {open && <p className="past-card__summary">{e.summary}</p>}
        <Link href={href} className="btn btn--dark">
          {e.buttonLabel}
        </Link>
      </div>
    </li>
  );
}
