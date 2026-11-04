// One-off migration: copy the media we scraped from the Wix site into public/media
// at web-friendly sizes. Usage: node scripts/import-wix-media.mjs <capture-dir>
// <capture-dir> must contain assets/ (original Wix files) and tiles/ (sliced collage).
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

sharp.cache(false);
const CAP = process.argv[2];
if (!CAP) throw new Error('usage: node scripts/import-wix-media.mjs <capture-dir>');
const A = (f) => path.join(CAP, 'assets', f);
const OUT = path.resolve('public/media');
await fs.mkdir(path.join(OUT, 'events'), { recursive: true });
await fs.mkdir(path.join(OUT, 'team'), { recursive: true });
await fs.mkdir(path.join(OUT, 'collage'), { recursive: true });
await fs.mkdir(path.join(OUT, 'site'), { recursive: true });

const jpg = (src, dest, width) =>
  sharp(src, { limitInputPixels: false }).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(dest);

const jobs = [
  // site chrome
  [A('3964c6_4ee6709b89704731a12ab0b8b2b52f63_mv2.png'), 'site/seal.png', 640, 'png'],
  [A('3964c6_d2689514194e4f669a57d4ba85e76e5d_mv2.png'), 'site/photo-strip.jpg', 2880],
  [A('3964c6_b07dc397f1ad488cb993d814e03144ad_mv2.jpg'), 'site/contact-background.jpg', 2200],
  // events
  [A('fd6949_d1b83a18957f4a098125044ac8719d02_mv2.jpg'), 'events/public-speaking-crash-course.jpg', 2000],
  [A('fd6949_54199c6edea74b6d8a3a9c2b121c83c3_mv2.jpg'), 'events/jonathan-pageau-ai-and-transhumanism.jpg', 2000],
  [A('fd6949_8d3f4f7b9ca74b2d92245c41bb944d3f_mv2.jpg'), 'events/open-forum-is-political-violence-ever-justified.jpg', 2000],
  [A('3964c6_d98e18c7d4cc435ebb914ebf3c9924a7_mv2.jpg'), 'events/open-forum-is-america-still-a-republic.jpg', 2000],
  [A('fcaa6d_6ee7ae73e7984a549d7590ceab896edd_mv2.jpg'), 'events/open-forum-does-urbanization-promote-human-flourishing.jpg', 2000],
  [A('3964c6_510ce5dcd7cc4a29882cf0439fafe617_mv2.jpg'), 'events/open-forum-is-america-a-christian-nation.jpg', 2000],
  [A('3964c6_3285a21c3073434cade60207a32bb7e6_mv2.jpg'), 'events/beyond-athens-and-jerusalem-by-william-posey.jpg', 2000],
  [A('3964c6_7a5be0ce6e6d4e3893e9af8b1b8b0e40_mv2.jpg'), 'events/weekend-crash-course.jpg', 2000],
  [A('3964c6_82c7e3937eb44b8283ea08505b583c85_mv2.jpg'), 'events/sir-niall-ferguson-on-ai-and-the-future-of-education.jpg', 2000],
  [A('3964c6_7197d0691666419ca73ab06a08eb3aa1_mv2.jpg'), 'events/jason-calacanis-dave-rubin-and-joe-lonsdale.jpg', 2000],
  [A('3964c6_da2498d2a9554beda91102cee5d3fe4b_mv2.jpg'), 'events/do-we-need-marxism-today-with-phil-magness-and-clara-mattei.jpg', 2000],
  // recap photos embedded in past event descriptions
  [A('3964c6_2efbc7b4ce99435d8f7a7cfe61364514_mv2.jpg'), 'events/recap-ferguson-1.jpg', 1600],
  [A('3964c6_4f463fd7e45f48048611f75b95f9ac3c_mv2.jpg'), 'events/recap-ferguson-2.jpg', 1600],
  [A('3964c6_8f456a15aaeb4bc981840388b32c6338_mv2.jpg'), 'events/recap-ferguson-3.jpg', 1600],
  [A('3964c6_ab2c1a92b1d4423aaa7ab7e4a88cfecb_mv2.jpg'), 'events/recap-ferguson-4.jpg', 1600],
  [A('3964c6_cf7638f1a11f4fcd88c9a2d7e9d80fd3_mv2.jpg'), 'events/recap-ferguson-5.jpg', 1600],
  [A('3964c6_24ea6119de75468abf1ff0df61014029_mv2.jpg'), 'events/recap-calacanis-1.jpg', 1600],
  [A('3964c6_651f51109e53439293f7e818e7a1f764_mv2.jpg'), 'events/recap-calacanis-2.jpg', 1600],
  [A('3964c6_6a699e641a4743d1be65876544913b1a_mv2.jpg'), 'events/recap-calacanis-3.jpg', 1600],
  [A('3964c6_aa79e2b6bcef4150962593dbed2b8553_mv2.jpg'), 'events/recap-calacanis-4.jpg', 1600],
  // team
  [A('fd6949_8b9b3a6ad8e34e56b0a891389d99de0b_mv2.jpg'), 'team/samuel-indyk.jpg', 900],
  [A('fd6949_a926e502c603486eb19470cf40c99cb3_mv2.jpg'), 'team/merrick-meardon.jpg', 1400],
  [A('fd6949_1a1c03b4c6ed401c99741091ef12c76c_mv2.jpg'), 'team/eitan-zarin.jpg', 900],
  [A('fd6949_54e85bfe53164c4eaeb2bb4a84356d0e_mv2.jpeg'), 'team/francesca-naugle.jpg', 1170],
  [A('fd6949_c9b73770b0cf46bbbaf27926cead8fa9_mv2.jpg'), 'team/luke-bradley.jpg', 1079],
  [A('3964c6_c5474073cf524478a0b767394a20d197_mv2.jpg'), 'team/analina-naugle.jpg', 900],
  [A('fd6949_4ca545f8192f4f4f9cde5f89a012412e_mv2.jpg'), 'team/benjamin-fortinsky.jpg', 1400],
];

for (const [src, dest, width, fmt] of jobs) {
  const out = path.join(OUT, dest);
  if (fmt === 'png') {
    await sharp(src).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(out);
  } else {
    await jpg(src, out, width);
  }
  console.log('wrote', dest);
}

// Social share image: the 41667x16667 Wix original, letterboxed onto 1200x630.
const og = await sharp(A('3964c6_685e5fda17a142d78fdd1b7f84c65d14_mv2.png'), { limitInputPixels: false })
  .resize({ width: 1100, height: 560, fit: 'inside' }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#ffffff' } })
  .composite([{ input: og, gravity: 'center' }]).png().toFile(path.resolve('src/app/opengraph-image.png'));
console.log('wrote src/app/opengraph-image.png');

// Favicon / app icon from the seal.
await sharp(A('3964c6_6cdd33e9169248b9b1c306ea77a7ddfe_mv2.png')).resize(512, 512).png().toFile(path.resolve('src/app/icon.png'));
await sharp(A('3964c6_6cdd33e9169248b9b1c306ea77a7ddfe_mv2.png')).resize(180, 180).flatten({ background: '#ffffff' }).png().toFile(path.resolve('src/app/apple-icon.png'));
console.log('wrote icons');

// Collage tiles (already sliced from the composite). Store grayscale + record dimensions.
const tiles = JSON.parse(await fs.readFile(path.join(CAP, 'tiles', 'tiles.json'), 'utf8'));
const manifest = [];
for (const t of tiles) {
  const dest = `collage/${t.file}`;
  const info = await sharp(path.join(CAP, 'tiles', t.file)).grayscale().resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, dest));
  manifest.push({ src: `/media/${dest}`, width: info.width, height: info.height });
}
await fs.writeFile(path.resolve('src/lib/content/collage-seed.json'), JSON.stringify(manifest, null, 1));
console.log('wrote', manifest.length, 'collage tiles');
