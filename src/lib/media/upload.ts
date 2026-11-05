// Image uploads: normalise (orientation, size, format), make a blurred preview,
// store in the public "media" bucket and return an ImageRef the site can use.
import 'server-only';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { blurDataURL } from '@/lib/collage-render';
import type { ImageRef } from '@/lib/content/types';
import { serviceClient } from '@/lib/supabase/clients';

const MAX_BYTES = 15 * 1024 * 1024;

export interface UploadOptions {
  folder: 'events' | 'team' | 'collage' | 'recaps' | 'site';
  maxWidth?: number;
  grayscale?: boolean;
  alt?: string;
}

export async function uploadImage(file: File, opts: UploadOptions): Promise<ImageRef & { width: number; height: number }> {
  if (!file || file.size === 0) throw new Error('No image selected.');
  if (file.size > MAX_BYTES) throw new Error('That image is over 15 MB — please use a smaller one.');
  if (!/^image\//.test(file.type)) throw new Error('Please choose an image file (JPEG, PNG, WebP or HEIC).');

  const input = Buffer.from(await file.arrayBuffer());
  let pipeline = sharp(input, { limitInputPixels: false }).rotate().resize({ width: opts.maxWidth ?? 2400, withoutEnlargement: true });
  if (opts.grayscale) pipeline = pipeline.grayscale();
  // JPEG, not WebP: these images are also used in emails, where WebP support is patchy.
  const { data, info } = await pipeline.jpeg({ quality: 84, mozjpeg: true }).toBuffer({ resolveWithObject: true });

  const path = `${opts.folder}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.jpg`;
  const storage = serviceClient().storage.from('media');
  const { error } = await storage.upload(path, data, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: pub } = storage.getPublicUrl(path);

  return {
    src: pub.publicUrl,
    alt: opts.alt ?? '',
    width: info.width,
    height: info.height,
    focalX: 50,
    focalY: 50,
    blurDataURL: await blurDataURL(data),
  };
}

/** Download an image's bytes (local /media seed files or uploaded URLs). */
export async function readImage(src: string): Promise<Buffer> {
  if (src.startsWith('/')) {
    const { promises: fs } = await import('node:fs');
    const path = await import('node:path');
    return fs.readFile(path.join(process.cwd(), 'public', src));
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Could not fetch ${src}`);
  return Buffer.from(await res.arrayBuffer());
}
