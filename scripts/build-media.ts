// Precomputes media metadata for the seed content:
//  1. a blurred preview + dimensions for every image under public/media
//     (written to src/lib/content/media-meta.json), and
//  2. the composed homepage banner (desktop + mobile) from the collage photos
//     (written to public/media/collage/ and src/lib/content/collage-banner.json).
// Usage: node scripts/build-media.ts
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { blurDataURL, renderCollage, type CollageSource } from '../src/lib/collage-render.ts';

const ROOT = process.cwd();
const MEDIA = path.join(ROOT, 'public', 'media');

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) out.push(p);
  }
  return out;
}

// 1. Banner composites
interface SeedTile {
  src: string;
  width: number;
  height: number;
  emphasis?: number;
}
const tiles: SeedTile[] = JSON.parse(await fs.readFile(path.join(ROOT, 'src/lib/content/collage-seed.json'), 'utf8'));
const sources: CollageSource[] = await Promise.all(
  tiles.map(async (t, i) => ({
    id: `seed-${i}`,
    width: t.width,
    height: t.height,
    emphasis: t.emphasis,
    data: await fs.readFile(path.join(ROOT, 'public', t.src)),
  })),
);

const collageDir = path.join(MEDIA, 'collage');
for (const f of await fs.readdir(collageDir)) if (f.startsWith('banner-')) await fs.unlink(path.join(collageDir, f));

const banner: Record<string, { src: string; width: number; height: number; blurDataURL: string }> = {};
for (const [variant, w, h, max] of [
  ['desktop', 2880, 1430, sources.length],
  ['mobile', 780, 1280, 12],
] as const) {
  const r = await renderCollage(sources, w, h, max);
  const hash = createHash('sha1').update(r.data).digest('hex').slice(0, 8);
  const file = `banner-${variant}-${hash}.jpg`;
  await fs.writeFile(path.join(collageDir, file), r.data);
  banner[variant] = { src: `/media/collage/${file}`, width: w, height: h, blurDataURL: r.blurDataURL };
  console.log('banner', variant, file, `${Math.round(r.data.length / 1024)} KB`);
}
await fs.writeFile(path.join(ROOT, 'src/lib/content/collage-banner.json'), JSON.stringify(banner, null, 1));

// 2. Blur previews for every other image
const meta: Record<string, { width: number; height: number; blurDataURL: string }> = {};
for (const file of await walk(MEDIA)) {
  const rel = '/' + path.relative(path.join(ROOT, 'public'), file).split(path.sep).join('/');
  if (rel.startsWith('/media/collage/')) continue;
  const data = await fs.readFile(file);
  const m = await sharp(data).metadata();
  meta[rel] = { width: m.width!, height: m.height!, blurDataURL: await blurDataURL(data) };
}
await fs.writeFile(path.join(ROOT, 'src/lib/content/media-meta.json'), JSON.stringify(meta, null, 1));
console.log('media meta for', Object.keys(meta).length, 'images');
