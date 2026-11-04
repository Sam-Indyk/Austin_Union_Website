import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // AVIF is ~30-50% smaller than WebP for photos; browsers without it get WebP.
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 75, 85],
  },
  // The Wix URLs (/events-1, /about-4, /contact-8) are kept so existing links keep
  // working; these friendlier aliases point at them.
  async redirects() {
    return [
      { source: '/events', destination: '/events-1', permanent: false },
      { source: '/mission', destination: '/about-4', permanent: false },
      { source: '/about', destination: '/about-4', permanent: false },
      { source: '/contact', destination: '/contact-8', permanent: false },
      // Wix's event registration form URLs
      { source: '/event-details/:slug', destination: '/events/:slug', permanent: true },
      { source: '/event-details/:slug/form', destination: '/events/:slug#rsvp', permanent: true },
    ];
  },
};

export default nextConfig;
