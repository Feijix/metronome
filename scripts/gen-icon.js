// Generates PNG app icons from the cartoon metronome vector.
// Trims the surrounding whitespace, then centres the metronome inside a white
// square at a comfortable size for launcher / PWA icons.

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const SRC     = path.join(__dirname, '..', 'classic-metronome-icon-cartoon-style-vector.jpg');
const RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const ROOT    = path.join(__dirname, '..');

const DENSITIES = [
  { name: 'mdpi',    size: 48  },
  { name: 'hdpi',    size: 72  },
  { name: 'xhdpi',   size: 96  },
  { name: 'xxhdpi',  size: 144 },
  { name: 'xxxhdpi', size: 192 },
];

const WHITE  = { r: 255, g: 255, b: 255, alpha: 1 };
const CANVAS = 1024;             // master icon resolution
// ~20% smaller than before (0.62 → ~0.50) so it sits cleanly inside a circle mask.
const INNER  = Math.round(CANVAS * 0.50);

// Recolour the (red) metronome to black while keeping the white scale white.
// Map luminance through a smoothstep: dark/coloured body → black, highlights →
// white, with a smooth ramp so antialiased edges stay clean.
function blackenToBuffer(rawData) {
  const { data } = rawData;
  const lo = 110, hi = 210;
  for (let i = 0; i < data.length; i += 4) {
    const L = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let t = (L - lo) / (hi - lo);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const v = Math.round(255 * (t * t * (3 - 2 * t)));
    data[i] = data[i + 1] = data[i + 2] = v; // alpha untouched
  }
  return data;
}

async function main() {
  // 1. Trim the white border so we have tight metronome bounds.
  const trimmed = await sharp(SRC).trim().toBuffer();
  const tMeta = await sharp(trimmed).metadata();
  console.log(`Trimmed metronome: ${tMeta.width}×${tMeta.height}`);

  // 2. Recolour red → black via a raw-pixel luminance remap.
  const raw = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const blackened = blackenToBuffer(raw);
  const blackBuf = await sharp(blackened, {
    raw: { width: raw.info.width, height: raw.info.height, channels: 4 },
  }).png().toBuffer();

  // 3. Scale it to fit within INNER×INNER (keeps aspect ratio).
  const fitted = await sharp(blackBuf)
    .resize({ width: INNER, height: INNER, fit: 'contain', background: WHITE })
    .toBuffer();

  // 3. Centre it on a white CANVAS×CANVAS square.
  const master = await sharp({
      create: { width: CANVAS, height: CANVAS, channels: 4, background: WHITE },
    })
    .composite([{ input: fitted, gravity: 'center' }])
    .png()
    .toBuffer();

  // 4. Resize + write all Android densities (launcher, round, adaptive fg).
  for (const { name, size } of DENSITIES) {
    const dir = path.join(RES_DIR, `mipmap-${name}`);
    fs.mkdirSync(dir, { recursive: true });
    const png = await sharp(master).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'),            png);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'),      png);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), png);
    console.log(`  ${name} ${size}×${size}`);
  }

  // 5. PWA icons.
  fs.writeFileSync(path.join(ROOT, 'icon-192.png'), await sharp(master).resize(192, 192).png().toBuffer());
  fs.writeFileSync(path.join(ROOT, 'icon-512.png'), await sharp(master).resize(512, 512).png().toBuffer());
  console.log('  PWA 192 + 512');
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
