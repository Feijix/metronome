// Generates the app icons from the sources in assets/app_icon/.
// Run: node scripts/gen-icon.js
//
//  - Android 8+ (adaptive icon): vector foreground + solid background colour,
//    used for both ic_launcher and ic_launcher_round.
//  - Android 7 and older (legacy): PNG ic_launcher (rounded square) and
//    ic_launcher_round (circle) per density, rendered from the same art and
//    cropped to the adaptive icon's visible area (the centre 72 of 108 units).
//  - PWA: icon-192 / icon-512 as the full-bleed square (manifest: maskable).

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const ROOT    = path.join(__dirname, '..');
const SRC     = path.join(ROOT, 'assets', 'app_icon');
const RES_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const DENSITIES = [
  { name: 'mdpi',    size: 48  },
  { name: 'hdpi',    size: 72  },
  { name: 'xhdpi',   size: 96  },
  { name: 'xxhdpi',  size: 144 },
  { name: 'xxxhdpi', size: 192 },
];

const read = f => fs.readFileSync(path.join(SRC, f));
const write = (rel, data) => {
  const out = path.join(RES_DIR, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, data);
  console.log('  res/' + rel.replace(/\\/g, '/'));
};
const remove = rel => {
  const p = path.join(RES_DIR, rel);
  if (fs.existsSync(p)) { fs.unlinkSync(p); console.log('  removed res/' + rel.replace(/\\/g, '/')); }
};

// Full 108×108 artwork (background + foreground) at `px` pixels.
async function renderFull(px) {
  // The SVGs are 432px wide at sharp's default 72 dpi; render them natively at
  // `px` (2× then downscale, for clean antialiasing at small sizes).
  const density = 72 * (px * 2) / 432;
  const bg = await sharp(read('ic_launcher_background.svg'), { density }).resize(px, px).png().toBuffer();
  const fg = await sharp(read('ic_launcher_foreground.svg'), { density }).resize(px, px).png().toBuffer();
  return sharp(bg).composite([{ input: fg }]).png().toBuffer();
}

// Legacy launcher icon: the visible centre 72/108 of the art, masked.
async function renderLegacy(size, shape) {
  const full = Math.round(size * 108 / 72);
  const off = Math.round((full - size) / 2);
  const art = await sharp(await renderFull(full))
    .extract({ left: off, top: off, width: size, height: size }).png().toBuffer();
  const r = shape === 'circle' ? size / 2 : size * 0.2;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
  return sharp(art).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function main() {
  console.log('Adaptive icon (Android 8+):');
  write('drawable/ic_launcher_foreground.xml', read('ic_launcher_foreground.xml'));
  write('values/ic_launcher_background.xml', read('ic_launcher_background_color.xml'));
  write('mipmap-anydpi-v26/ic_launcher.xml', read('ic_launcher.xml'));
  write('mipmap-anydpi-v26/ic_launcher_round.xml', read('ic_launcher.xml'));
  // Capacitor template leftovers: the v24 foreground would shadow the new
  // drawable on API 24+, and the old PNG foregrounds are no longer referenced.
  remove('drawable-v24/ic_launcher_foreground.xml');
  remove('drawable/ic_launcher_background.xml');

  console.log('Legacy icons (Android 7 and older):');
  for (const { name, size } of DENSITIES) {
    write(`mipmap-${name}/ic_launcher.png`, await renderLegacy(size, 'square'));
    write(`mipmap-${name}/ic_launcher_round.png`, await renderLegacy(size, 'circle'));
    remove(`mipmap-${name}/ic_launcher_foreground.png`);
  }

  console.log('PWA icons:');
  for (const px of [192, 512]) {
    fs.writeFileSync(path.join(ROOT, `icon-${px}.png`), await renderFull(px));
    console.log(`  icon-${px}.png`);
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
