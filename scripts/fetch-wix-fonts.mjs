// Downloads the display fonts the Austin Union uploaded to Wix into public/fonts/.
// They are Walden Font Co. commercial fonts: keep them out of git (see .gitignore)
// until the web license is confirmed. Usage: node scripts/fetch-wix-fonts.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const FONTS = {
  'neue-ohio-schrift.woff2': '3964c6_7ee2852c27b147169fcb01e2eee77520',
  'neue-ohio-schrift-italic.woff2': '3964c6_437e32bf71bc4d2ca82b6bfc841b768b',
  'kraftwerk-vignetten.woff2': '3964c6_c1efde0e89c64aeb88fc03f983a6bca9',
  'colonial-bullets.woff2': '24e875_6a12f7d9d3e544b3be37ed49767c0d4b',
};

const dir = path.resolve('public/fonts');
await fs.mkdir(dir, { recursive: true });
for (const [file, id] of Object.entries(FONTS)) {
  const res = await fetch(`https://static.wixstatic.com/ufonts/${id}/woff2/file.woff2`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  await fs.writeFile(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
  console.log('saved', file);
}
