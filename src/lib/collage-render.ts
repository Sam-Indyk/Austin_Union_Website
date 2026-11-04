// Renders the homepage banner mosaic into a single image.
//
// Serving one pre-composed picture (instead of ~30 separate tiles) lets the
// banner appear all at once: a tiny blurred preview shows immediately and the
// full image fades in when ready. This runs whenever the banner photos change
// (admin edit, or `node scripts/build-media.ts` for the seed photos).
import sharp from 'sharp';
import { layoutCollage, type LayoutPhoto } from './collage-layout.ts';

export interface CollageSource extends LayoutPhoto {
  /** Raw image bytes (any format sharp reads). */
  data: Buffer;
  focalX?: number;
  focalY?: number;
}

export interface RenderedCollage {
  data: Buffer;
  width: number;
  height: number;
  blurDataURL: string;
}

/** Crop a source to the target aspect ratio around its focal point, then resize. */
async function coverCrop(src: CollageSource, w: number, h: number): Promise<Buffer> {
  const img = sharp(src.data, { limitInputPixels: false }).rotate();
  const meta = await img.metadata();
  const sw = meta.autoOrient?.width ?? meta.width!;
  const sh = meta.autoOrient?.height ?? meta.height!;
  const target = w / h;
  let cw = sw;
  let ch = Math.round(sw / target);
  if (ch > sh) {
    ch = sh;
    cw = Math.round(sh * target);
  }
  const fx = (src.focalX ?? 50) / 100;
  const fy = (src.focalY ?? 50) / 100;
  const left = Math.min(Math.max(Math.round(fx * sw - cw / 2), 0), sw - cw);
  const top = Math.min(Math.max(Math.round(fy * sh - ch / 2), 0), sh - ch);
  return img
    .extract({ left, top, width: cw, height: ch })
    .resize(w, h, { kernel: 'lanczos3' })
    .grayscale()
    .toBuffer();
}

export async function renderCollage(photos: CollageSource[], width: number, height: number, maxPhotos = photos.length): Promise<RenderedCollage> {
  const used = photos.slice(0, maxPhotos);
  const tiles = layoutCollage(used, width / height);
  const byId = new Map(used.map((p) => [p.id, p]));

  // Snap tile edges to whole pixels so neighbours meet exactly with no seams.
  const layers = await Promise.all(
    tiles.map(async (t) => {
      const x0 = Math.round((t.left / 100) * width);
      const y0 = Math.round((t.top / 100) * height);
      const x1 = Math.round(((t.left + t.width) / 100) * width);
      const y1 = Math.round(((t.top + t.height) / 100) * height);
      const input = await coverCrop(byId.get(t.id)!, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
      return { input, left: x0, top: y0 };
    }),
  );

  const data = await sharp({ create: { width, height, channels: 3, background: '#222222' } })
    .composite(layers)
    .jpeg({ quality: 84, mozjpeg: true, progressive: true })
    .toBuffer();

  return { data, width, height, blurDataURL: await blurDataURL(data) };
}

/** A ~30px-wide JPEG as a data URL, for the blurred preview shown while the real image loads. */
export async function blurDataURL(data: Buffer): Promise<string> {
  const tiny = await sharp(data, { limitInputPixels: false }).rotate().resize(32, 32, { fit: 'inside' }).jpeg({ quality: 55 }).toBuffer();
  return `data:image/jpeg;base64,${tiny.toString('base64')}`;
}
