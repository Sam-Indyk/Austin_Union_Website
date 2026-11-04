import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';

// The Wix site was set to hide from search engines. Indexing is on here unless
// SITE_INDEXING=off (preview deployments should set that).
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEXING === 'off') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
