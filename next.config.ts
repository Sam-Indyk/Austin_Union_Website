import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // AVIF is ~30-50% smaller than WebP for photos; browsers without it get WebP.
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 75, 85],
  },
  // Pages use plain names (/events, /mission, /contact). The old Wix addresses
  // redirect permanently so links in past emails and posts keep working.
  async redirects() {
    return [
      { source: '/events-1', destination: '/events', permanent: true },
      { source: '/about-4', destination: '/mission', permanent: true },
      { source: '/about', destination: '/mission', permanent: true },
      { source: '/contact-8', destination: '/contact', permanent: true },
      // Wix's event registration form URLs
      { source: '/event-details/:slug', destination: '/events/:slug', permanent: true },
      { source: '/event-details/:slug/form', destination: '/events/:slug#rsvp', permanent: true },
    ];
  },
};

export default nextConfig;
