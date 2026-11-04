// Monochrome brand glyphs (simplified, drawn to the same 24px grid).
import type React from 'react';
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

export const XIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z" />
  </svg>
);

export const InstagramIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.74.07-2.38.11-3.48 1.23-3.59 3.59C3.61 8.9 3.6 9.27 3.6 12s.01 3.1.07 4.34c.11 2.35 1.2 3.48 3.59 3.59 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c2.38-.11 3.48-1.24 3.59-3.59.06-1.24.07-1.6.07-4.34s-.01-3.1-.07-4.34c-.11-2.36-1.21-3.48-3.59-3.59C15.5 4.01 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06Zm0 8.14a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm5.14-9.5a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
  </svg>
);

export const YouTubeIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
);

export const LinkedInIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.5H3V9.75Zm6.5 0h3.83v1.57h.06c.53-1 1.84-2.07 3.79-2.07 4.05 0 4.8 2.67 4.8 6.13v5.87h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75v5.29h-4V9.75Z" />
  </svg>
);

export const FacebookIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M13.5 21v-7.6h2.56l.38-2.97H13.5V8.53c0-.86.24-1.45 1.47-1.45h1.57V4.42A21 21 0 0 0 14.25 4.3c-2.27 0-3.82 1.38-3.82 3.93v2.2H7.86v2.97h2.57V21h3.07Z" />
  </svg>
);

/** Round black badge used on the Team cards (Wix "circle" social bar style). */
export const CircleBadge = ({ icon: Icon }: { icon: (p: P) => React.JSX.Element }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#000" />
    <svg x="6" y="6" width="12" height="12" viewBox="0 0 24 24" color="#fff">
      <Icon />
    </svg>
  </svg>
);

export const ChatIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3.5 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
  </svg>
);
