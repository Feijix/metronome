// Generates the baked click samples that can't be reliably sourced as a clean,
// single-hit CC0/PD recording:
//   digital.wav    — a crisp electronic metronome beep (a digital metronome is
//                    an electronic tone, so synthesis is the authentic source)
//   block.wav      — a hollow wood/temple-block "tok" (inharmonic partials +
//                    a short noise attack)
//   mechanical.wav — a dry wind-up-metronome escapement "tick" (mid/high click
//                    with a short plastic body; deliberately NOT a resonant
//                    low pendulum-clock "tock")
//   shaker.wav     — a natural egg-shaker/maraca burst (airy high-passed noise
//                    with a soft attack and a ~120ms decay, not an abrupt slice)
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
// (the "woody" character) and a short noise attack (the "k" of the tok).
// Tuned darker/rounder than the first version — lower fundamental, weaker
// high partials, and a gentler attack so it reads as wood, not a bright click.
function block() {
  const dur = 0.15, n = Math.floor(SR * dur), out = new Float32Array(n);
  const f = 620;
  // [ratio, amplitude, decay-tau] — upper partials rolled off for less "ping".
  const partials = [ [1.0, 1.0, 0.060], [2.76, 0.30, 0.020], [5.40, 0.10, 0.009] ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const [r, a, tau] of partials) s += a * Math.sin(2 * Math.PI * f * r * t) * Math.exp(-t / tau);
    // Softer, marginally longer noise attack: the wooden "tok" onset without
    // the bright transient tick the previous 0.5/1.5ms burst produced.
    s += (Math.random() * 2 - 1) * Math.exp(-t / 0.0025) * 0.28;
    out[i] = s;
  }
  return normalize(out, 0.9);
}

// Dry mechanical-metronome tick: a sharp broadband click plus a couple of
// fast-decaying mid/high resonances for the "plastic escapement" body. Kept
// short with no low resonant tail so it reads as a metronome tick, not a
// hollow pendulum-clock tock. A tanh soft-clip raises its RMS so this very
// short click carries as loud as the ringing (clave/cowbell) sounds.
function mechanical() {
  const dur = 0.06, n = Math.floor(SR * dur), out = new Float32Array(n);
  // [freq, amplitude, decay-tau] — mid/high only; slightly longer decays add
  // a touch more energy (loudness) without a clocky low tail.
  const partials = [ [2000, 0.60, 0.0060], [3100, 0.40, 0.0050], [4300, 0.20, 0.0035] ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const [f, a, tau] of partials) s += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-t / tau);
    s += (Math.random() * 2 - 1) * Math.exp(-t / 0.0020) * 0.9; // sharp click transient
    out[i] = Math.tanh(s * 3);   // soft-clip → fatter, louder click
  }
  return normalize(out, 0.95);
}

// Natural egg-shaker / maraca. First-difference of white noise gives the airy
// high end. The envelope models real shaker motion: the beads are ALREADY
// moving before the beat — an accelerating "swish" lead-in that rises into a
// sharper "hit" at HIT seconds (aligned to the beat by SamplePlayer's preHit),
// then a natural decay. This avoids the artificial hard-start-from-silence.
const SHAKER_HIT = 0.045; // seconds from buffer start to the on-beat hit
function shaker() {
  const hit = SHAKER_HIT, atk = 0.003, tau = 0.05, tail = 0.14;
  const dur = hit + tail, n = Math.floor(SR * dur), out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const white = Math.random() * 2 - 1;
    const hp = white - prev; prev = white;              // high-pass → airy hiss
    let env;
    if (t < hit - atk) {
      const x = t / (hit - atk);
      env = 0.7 * x * x;                                // beads accelerating in
    } else if (t < hit) {
      env = 0.7 + 0.3 * ((t - (hit - atk)) / atk);      // sharper hit attack
    } else {
      env = Math.exp(-(t - hit) / tau);                 // decay after the hit
    }
    env *= 0.85 + 0.15 * Math.sin(2 * Math.PI * 90 * t); // subtle grain
    out[i] = hp * env;
  }
  return normalize(out, 0.9);
}

fs.mkdirSync(DIR, { recursive: true });
writeWav(path.join(DIR, 'digital.wav'),    digital());
writeWav(path.join(DIR, 'block.wav'),      block());
writeWav(path.join(DIR, 'mechanical.wav'), mechanical());
writeWav(path.join(DIR, 'shaker.wav'),     shaker());
console.log('Wrote digital.wav + block.wav + mechanical.wav + shaker.wav');
