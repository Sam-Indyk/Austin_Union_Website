import type { MetadataRoute } from 'next';
import { getAllEventSlugs } from '@/lib/content/repo';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/events', '/mission', '/team', '/contact', '/donate'];
  const slugs = await getAllEventSlugs();
  return [...pages.map((p) => ({ url: `${SITE}${p}` })), ...slugs.map((s) => ({ url: `${SITE}/events/${s}` }))];
}
