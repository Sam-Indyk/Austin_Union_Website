// Server-side helpers for on-page editing: reading/writing content documents
// with revision history, and rebuilding the homepage banner.
import 'server-only';
import { createHash } from 'node:crypto';
import { updateTag } from 'next/cache';
import { renderCollage, type CollageSource } from '@/lib/collage-render';
import { readImage } from '@/lib/media/upload';
import { serviceClient } from '@/lib/supabase/clients';
import type { Json } from '@/lib/supabase/database.types';
import type { CollageBanner } from './types';

export type DocKey = 'settings' | 'home' | 'mission' | 'team_page' | 'donate' | 'contact';

/** Which cache tag(s) each document feeds. */
const TAGS: Record<DocKey, string[]> = {
  settings: ['settings'],
  home: ['home'],
  mission: ['mission'],
  team_page: ['team'],
  donate: ['donate'],
  contact: ['contact'],
};

export async function readDoc<T>(key: DocKey): Promise<T> {
  const row = (await serviceClient().from('site_content').select('value').eq('key', key).maybeSingle()).data;
  if (!row) throw new Error(`Missing content "${key}"`);
  return row.value as unknown as T;
}

/** Save a document, keeping the previous version for undo. */
export async function writeDoc(key: DocKey, value: unknown, personId: string): Promise<void> {
  const db = serviceClient();
  const prev = (await db.from('site_content').select('value').eq('key', key).maybeSingle()).data;
  if (prev) await db.from('site_content_revisions').insert({ key, value: prev.value, saved_by: personId });
  const { error } = await db.from('site_content').upsert({ key, value: value as NonNullable<Json>, updated_by: personId });
  if (error) throw new Error(error.message);
  for (const t of TAGS[key]) updateTag(t);
}

/** Restore the most recent previous version. Returns false if there is none. */
export async function revertDoc(key: DocKey, personId: string): Promise<boolean> {
  const db = serviceClient();
  const last = (await db.from('site_content_revisions').select('id, value').eq('key', key).order('created_at', { ascending: false }).limit(1).maybeSingle()).data;
  if (!last) return false;
  const { error } = await db.from('site_content').upsert({ key, value: last.value, updated_by: personId });
  if (error) throw new Error(error.message);
  await db.from('site_content_revisions').delete().eq('id', last.id);
  for (const t of TAGS[key]) updateTag(t);
  return true;
}

export async function revisionCount(key: DocKey): Promise<number> {
  return (await serviceClient().from('site_content_revisions').select('id', { count: 'exact', head: true }).eq('key', key)).count ?? 0;
}

/** Recompose the banner from the current collage photos and publish it. */
export async function rebuildBanner(): Promise<CollageBanner> {
  const db = serviceClient();
  const photos = (await db.from('collage_photos').select('*').order('sort_order')).data ?? [];
  if (photos.length === 0) throw new Error('Add at least one photo to the banner.');
  const sources: CollageSource[] = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      emphasis: p.emphasis,
      focalX: p.focal_x,
      focalY: p.focal_y,
      data: await readImage(p.src),
    })),
  );
  const storage = db.storage.from('media');
  const out: Partial<CollageBanner> = {};
  for (const [variant, w, h, max] of [
    ['desktop', 2880, 1430, sources.length],
    ['mobile', 780, 1280, 12],
  ] as const) {
    const r = await renderCollage(sources, w, h, max);
    const hash = createHash('sha1').update(r.data).digest('hex').slice(0, 10);
    const path = `collage/banner-${variant}-${hash}.jpg`;
    const { error } = await storage.upload(path, r.data, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });
    if (error) throw new Error(`Banner upload failed: ${error.message}`);
    out[variant] = { src: storage.getPublicUrl(path).data.publicUrl, width: w, height: h, blurDataURL: r.blurDataURL };
  }
  await db.from('site_content').upsert({ key: 'collage_banner', value: out as unknown as NonNullable<Json> });
  updateTag('collage');
  return out as CollageBanner;
}
