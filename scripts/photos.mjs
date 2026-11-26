// Turns whatever is in photos/ into consistent cutouts in public/players/.
//   photos/jacob.png  ->  public/players/jacob.png
// - trims the empty transparent space around the person (so every cutout sits the same way)
// - crops to head and shoulders with a flat bottom edge
// - shrinks big phone photos down to 720px tall
// - keeps the transparent background (PNG)
// The black-and-white, halftone and white sticker border are added by CSS, so the
// originals can stay in colour. Runs automatically before `npm run dev` and `npm run build`.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'photos';
const OUT = 'public/players';
const HEAD_AND_SHOULDERS = 1.05; // max height as a multiple of width
fs.mkdirSync(OUT, { recursive: true });

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => /\.(png|webp)$/i.test(f)) : [];
const skipped = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => /\.(jpe?g|heic|heif)$/i.test(f)) : [];
for (const f of skipped) {
  console.warn(`! photos/${f}: JPG/HEIC can't have a see-through background. Remove the background and save it as PNG (see README).`);
}

let made = 0;
for (const f of files) {
  const id = path.parse(f).name.toLowerCase();
  const src = path.join(SRC, f);
  const out = path.join(OUT, `${id}.png`);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;

  const img = sharp(src).rotate(); // respect the phone's orientation
  const meta = await img.metadata();
  if (!meta.hasAlpha) {
    console.warn(`! photos/${f} has no transparent background, so it will show as a rectangle. Remove the background first.`);
  }
  const { data, info } = await img.trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
  // keep head + shoulders: anything taller than ~square gets a flat cut across the chest
  const maxH = Math.round(info.width * HEAD_AND_SHOULDERS);
  await sharp(data)
    .extract({ left: 0, top: 0, width: info.width, height: Math.min(info.height, maxH) })
    .resize({ height: 720, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
  made++;
  console.log(`✓ photos/${f} -> ${out}`);
}

// remove cutouts whose source photo was deleted
const keep = new Set(files.map(f => `${path.parse(f).name.toLowerCase()}.png`));
for (const f of fs.readdirSync(OUT)) if (!keep.has(f)) fs.unlinkSync(path.join(OUT, f));

console.log(`photos: ${files.length} cutout(s) ready${made ? `, ${made} updated` : ''}.`);
