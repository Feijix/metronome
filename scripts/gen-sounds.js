// Generates the two baked click samples that can't be reliably sourced as a
// clean single-hit recording:
//   digital.wav — a crisp electronic metronome beep (a digital metronome is an
//                 electronic tone, so synthesis is the authentic source here)
//   block.wav   — a hollow wood/temple-block "tok" via additive synthesis with
//                 inharmonic partials + a short noise attack
// Output: 44.1kHz mono 16-bit PCM WAV (decodes in Web Audio everywhere).

const fs   = require('fs');
const path = require('path');

const SR  = 44100;
const DIR = path.join(__dirname, '..', 'assets', 'sounds');

function normalize(out, peak = 0.92) {
  let max = 0;
  for (let i = 0; i < out.length; i++) max = Math.max(max, Math.abs(out[i]));
  if (max > 0) { const g = peak / max; for (let i = 0; i < out.length; i++) out[i] *= g; }
  return out;
}

function writeWav(file, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);                buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);                buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);           buf.writeUInt16LE(1, 20);   // PCM
  buf.writeUInt16LE(1, 22);            buf.writeUInt32LE(SR, 24);  // mono
  buf.writeUInt32LE(SR * 2, 28);       buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);           buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
}

// Clean digital metronome beep: bright tone (fundamental + a little 2nd/3rd
// harmonic for "edge"), 2ms attack, ~18ms exponential decay.
function digital() {
  const dur = 0.13, n = Math.floor(SR * dur), out = new Float32Array(n);
  const f = 2000;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = t < 0.002 ? t / 0.002 : Math.exp(-(t - 0.002) / 0.018);
    const s = Math.sin(2 * Math.PI * f * t)
            + 0.35 * Math.sin(2 * Math.PI * 2 * f * t)
            + 0.12 * Math.sin(2 * Math.PI * 3 * f * t);
    out[i] = s * env;
  }
  return normalize(out, 0.9);
}

// Hollow wood/temple block: dominant pitch with inharmonic upper partials
// (the "woody" character) and a 1.5ms noise attack (the "k" of the tok).
function block() {
  const dur = 0.13, n = Math.floor(SR * dur), out = new Float32Array(n);
  const f = 900;
  const partials = [ [1.0, 1.0, 0.045], [2.76, 0.55, 0.022], [5.40, 0.28, 0.011] ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const [r, a, tau] of partials) s += a * Math.sin(2 * Math.PI * f * r * t) * Math.exp(-t / tau);
    s += (Math.random() * 2 - 1) * Math.exp(-t / 0.0015) * 0.5; // attack noise
    out[i] = s;
  }
  return normalize(out, 0.9);
}

fs.mkdirSync(DIR, { recursive: true });
writeWav(path.join(DIR, 'digital.wav'), digital());
writeWav(path.join(DIR, 'block.wav'),   block());
console.log('Wrote digital.wav + block.wav');
