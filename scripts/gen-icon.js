// Generates PNG app icons from wittner_metronome.jpg.
// Paints over the scale face and logo to remove all text/symbols,
// keeps the metronome shape/contours, then adds padding and resizes.

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const SRC     = path.join(__dirname, '..', 'wittner_metronome.jpg');
const RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const ROOT    = path.join(__dirname, '..');

const DENSITIES = [
  { name: 'mdpi',    size: 48  },
  { name: 'hdpi',    size: 72  },
  { name: 'xhdpi',   size: 96  },
  { name: 'xxhdpi',  size: 144 },
  { name: 'xxxhdpi', size: 192 },
];

// Extra white padding added on each side so the metronome reads smaller
// and sits comfortably inside the icon frame.
const PAD = 400; // pixels added on each side (at source resolution)

async function main() {
  const meta = await sharp(SRC).metadata();
  const W = meta.width;   // 1200
  const H = meta.height;  // 1200
  console.log(`Source: ${W}×${H}`);

  // ── 1. Paint over text/symbols ─────────────────────────────────────────
  // Scale face (the large numbered panel that runs most of the body height).
  // Fill with a flat warm light-gray that matches the untextured portions of
  // the panel.  This removes all BPM numbers while keeping the face visible.
  //
  // Logo plate: fill with the body dark colour so it disappears into the body.
  //
  // Coordinates measured from the 1200×1200 source.
  // Source coordinates (script adds PAD before compositing).
  // At PAD=400 the final image is 2000×2000.  Scale face numbers are ~12px
  // tall in source → <2px at 192px icon size — invisible due to downscaling.
  // Only the logo plate has text large enough to read at launcher icon sizes.
  const paints = [
    // Logo plate + "made in Germany": source x≈290–822, y≈656–824
    { left: 290, top: 656, width: 532, height: 170, fill: '#1b1919' },
  ];

  const overlays = paints.map(r => ({
    input: Buffer.from(
      `<svg width="${r.width}" height="${r.height}">
         <rect width="${r.width}" height="${r.height}" fill="${r.fill}"/>
       </svg>`
    ),
    left: r.left,
    top:  r.top,
  }));

  // ── 2. Add white padding so the metronome sits small inside the icon ───
  // Sharp applies .extend() BEFORE .composite() internally regardless of call
  // order.  So composite coordinates must be offset by PAD to hit the right
  // position in the extended (1200+2*PAD) × (1200+2*PAD) image.
  const paddedOverlays = overlays.map(o => ({
    ...o, left: o.left + PAD, top: o.top + PAD,
  }));

  const padded = await sharp(SRC)
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD,
               background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .composite(paddedOverlays)
    .toBuffer();

  const totalSize = W + PAD * 2; // 1600

  // ── 3. Resize and write ───────────────────────────────────────────────
  for (const { name, size } of DENSITIES) {
    const dir = path.join(RES_DIR, `mipmap-${name}`);
    fs.mkdirSync(dir, { recursive: true });
    const png = await sharp(padded).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'),            png);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'),      png);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), png);
    console.log(`  ${name} ${size}×${size}`);
  }

  const p192 = await sharp(padded).resize(192, 192).png().toBuffer();
  const p512 = await sharp(padded).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(ROOT, 'icon-192.png'), p192);
  fs.writeFileSync(path.join(ROOT, 'icon-512.png'), p512);
  console.log('  PWA 192 + 512');
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
