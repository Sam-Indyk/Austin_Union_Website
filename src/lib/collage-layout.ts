// Automatic photo-mosaic layout for the homepage banner.
//
// Given photos with natural sizes and a target frame, we recursively split the
// frame into two (side by side or stacked), dividing the photos between the
// halves, until every photo has its own tile. Among the candidate splits we keep
// the one whose tiles best match their photos' aspect ratios, so photos are
// cropped as little as possible. Admins only add, remove or reorder photos; the
// arrangement is recomputed for them.
//
// The result is expressed in percentages of the frame, so it scales with CSS.

export interface LayoutPhoto {
  id: string;
  width: number;
  height: number;
}

export interface Tile {
  id: string;
  /** Percentages of the frame (0–100). */
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Result {
  /** Tiles relative to the solved rect's top-left corner. */
  tiles: { id: string; rect: Rect }[];
  cost: number;
}

/** How far a tile's shape is from its photo's shape, weighted by tile area. */
function tileCost(photo: LayoutPhoto, w: number, h: number, frameArea: number): number {
  const tileAspect = w / h;
  const photoAspect = photo.width / photo.height;
  const distortion = Math.abs(Math.log(tileAspect / photoAspect));
  // Very thin slivers look bad regardless of the photo; penalise them extra.
  const sliver = Math.max(0, Math.abs(Math.log(tileAspect)) - Math.log(2.4)) * 2;
  const areaShare = (w * h) / frameArea;
  return (distortion + sliver) * (0.35 + areaShare * 6) + (distortion > 0.85 ? 0.4 : 0);
}

/** Area weight for a photo: landscape photos get a little more room than portraits. */
function weight(p: LayoutPhoto): number {
  const a = p.width / p.height;
  return Math.sqrt(Math.min(Math.max(a, 0.5), 2.2));
}

function solve(photos: LayoutPhoto[], start: number, end: number, w: number, h: number, frameArea: number, memo: Map<string, Result>): Result {
  const n = end - start;
  if (n === 1) {
    const p = photos[start];
    return { tiles: [{ id: p.id, rect: { x: 0, y: 0, w, h } }], cost: tileCost(p, w, h, frameArea) };
  }
  const key = `${start}:${end}:${w.toFixed(1)}:${h.toFixed(1)}`;
  const hit = memo.get(key);
  if (hit) return hit;

  const mid = start + n / 2;
  let best: Result | null = null;
  let total = 0;
  for (let i = start; i < end; i++) total += weight(photos[i]);

  for (let k = Math.max(start + 1, Math.floor(mid) - 1); k <= Math.min(end - 1, Math.ceil(mid) + 1); k++) {
    let wa = 0;
    for (let i = start; i < k; i++) wa += weight(photos[i]);
    const ratio = wa / total;
    for (const vertical of [true, false]) {
      const [w1, h1, w2, h2] = vertical ? [w * ratio, h, w * (1 - ratio), h] : [w, h * ratio, w, h * (1 - ratio)];
      const a = solve(photos, start, k, w1, h1, frameArea, memo);
      const b = solve(photos, k, end, w2, h2, frameArea, memo);
      const cost = a.cost + b.cost;
      if (best && cost >= best.cost) continue;
      const dx = vertical ? w1 : 0;
      const dy = vertical ? 0 : h1;
      best = {
        cost,
        tiles: [...a.tiles, ...b.tiles.map((t) => ({ id: t.id, rect: { ...t.rect, x: t.rect.x + dx, y: t.rect.y + dy } }))],
      };
    }
  }
  memo.set(key, best!);
  return best!;
}

/**
 * Lay out photos to exactly fill a frame of the given aspect ratio (width / height).
 * Photo order is respected as the reading order of the split tree, so admins can
 * influence placement by reordering.
 */
export function layoutCollage(photos: LayoutPhoto[], frameAspect: number): Tile[] {
  if (photos.length === 0) return [];
  const W = frameAspect * 1000;
  const H = 1000;
  const result = solve(photos, 0, photos.length, W, H, W * H, new Map());
  return result.tiles.map(({ id, rect }) => ({
    id,
    left: (rect.x / W) * 100,
    top: (rect.y / H) * 100,
    width: (rect.w / W) * 100,
    height: (rect.h / H) * 100,
  }));
}
