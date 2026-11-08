// Renders rhythmic-subdivision symbols to PNG data-URLs using the Bravura
// SMuFL music font for the actual glyphs (noteheads, rests, dots, tuplet
// numerals) and geometric primitives for stems, beams and tuplet brackets —
// exactly as engraving does. Geometry uses the SMuFL staff-space model
// (1 staff space = glyph em / 4) and was tuned to fit the shared H=42 box.

// SMuFL codepoints (Bravura). Built via fromCodePoint so the source stays
// plain ASCII (raw private-use chars don't survive some editors).
const GLYPH = {
  note:  String.fromCodePoint(0xE0A4), // noteheadBlack
  half:  String.fromCodePoint(0xE0A3), // noteheadHalf
  whole: String.fromCodePoint(0xE0A2), // noteheadWhole
  dot:   String.fromCodePoint(0xE1E7), // augmentationDot
  // Keyed by beam count: -2 whole, -1 half, 0 quarter, 1 8th, 2 16th, …
  rest:  { '-2': String.fromCodePoint(0xE4E3), // restWhole
           '-1': String.fromCodePoint(0xE4E4), // restHalf
           0: String.fromCodePoint(0xE4E5),   // restQuarter
           1: String.fromCodePoint(0xE4E6),   // rest8th
           2: String.fromCodePoint(0xE4E7),   // rest16th
           3: String.fromCodePoint(0xE4E8),   // rest32nd
           4: String.fromCodePoint(0xE4E9) }, // rest64th
  flag:  { 1: String.fromCodePoint(0xE240),   // flag8thUp
           2: String.fromCodePoint(0xE242),   // flag16thUp
           3: String.fromCodePoint(0xE244),   // flag32ndUp
           4: String.fromCodePoint(0xE246) }, // flag64thUp
  tuplet: n => String.fromCodePoint(0xE880 + n), // tupletN numeral (0–9)
};

// Load Bravura once (the @font-face lives in main.css). render() is synchronous
// and may run before the font is ready; callers should re-render on whenReady()
// to replace any fallback glyphs baked into the first raster.
let _fontPromise = null;
function ensureFont() {
  if (_fontPromise) return _fontPromise;
  _fontPromise = (typeof document !== 'undefined' && document.fonts && document.fonts.load)
    ? document.fonts.load('16px "Bravura"').then(() => document.fonts.ready).catch(() => {})
    : Promise.resolve();
  return _fontPromise;
}

export class NoteRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.color = '#ffffff';
    this.shift = 0;      // beam offset for the beat unit (set per render)

    // ── Engraving geometry (px @ CSS 1×) ──
    this.H       = 44;   // shared canvas height — every symbol scales identically
    this.baseY   = 36;   // notehead-centre baseline
    this.G       = 26;   // notehead glyph size
    this.sp      = this.G / 4;            // staff space
    this.headHalf = 0.66 * this.sp;       // half notehead width (for stem attach)
    this.stemW   = 1.4;
    this.stemLen = 3.4 * this.sp;         // regular stem
    this.stemLen32 = 3.9 * this.sp;       // 32nds: longer so 3 beams clear heads
    this.tStem   = 2.6 * this.sp;         // triplets: shorter so bracket fits in H
    this.beamTh  = 0.5 * this.sp;
    this.beamGap = 0.72 * this.sp;        // centre-to-centre between stacked beams
    this.restG   = this.G * 0.95;
    this.tupG    = this.G * 0.42;
    this.bracketGap = 5;
    this.stemFoot = 1.5;                   // seat the stem foot inside the notehead
    this.pad     = 14;                     // left/right margin around the group
  }

  static whenReady() { return ensureFont(); }

  get dpr() { return Math.min(3, Math.ceil(window.devicePixelRatio || 1)); }
  snap(v) { const d = this.dpr; return Math.round(v * d) / d; }

  setup(cssW) {
    const s = this.dpr;
    this.canvas.width  = Math.round(cssW * s);
    this.canvas.height = Math.round(this.H * s);
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
    this.ctx.clearRect(0, 0, cssW, this.H);
  }

  // ── Glyph + primitive drawing ────────────────────────────────────────────
  glyph(ch, x, y, px, align = 'center', baseline = 'alphabetic') {
    const ctx = this.ctx;
    ctx.font = `${px}px "Bravura"`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillStyle = this.color;
    ctx.fillText(ch, x, y);
  }

  stemXof(x) { return this.snap(x + this.headHalf - this.stemW / 2); }

  // Notehead for a note with `beams` beams: ≥0 black, -1 half, ≤-2 whole.
  head(x, y, beams = 0) {
    const g = beams >= 0 ? GLYPH.note : beams === -1 ? GLYPH.half : GLYPH.whole;
    this.glyph(g, this.snap(x), this.snap(y), this.G);
  }

  // Note (head + stem; whole notes have no stem).
  note(x, baseY, beamY, beams) {
    this.head(x, baseY, beams);
    if (beams >= -1) this.stem(x, baseY, beamY);
  }

  // Stem length so stacked beams (32nds, 64ths) still clear the noteheads.
  stemFor(beams) {
    return beams >= 4 ? this.stemLen32 + this.beamGap
         : beams === 3 ? this.stemLen32
         : this.stemLen;
  }

  dot(x, y) {
    this.glyph(GLYPH.dot, this.snap(x + this.headHalf + 3), this.snap(y - 1), this.G);
  }

  stem(x, yBase, yBeam) {
    const ctx = this.ctx, sx = this.stemXof(x);
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.stemW;
    // 'butt' (not 'round'): a round cap adds half the stroke width past each
    // endpoint, which pokes above the beam and below the notehead. The foot is
    // seated slightly inside the notehead so it never overshoots the circle.
    ctx.lineCap = 'butt';
    ctx.moveTo(sx, this.snap(yBase - this.stemFoot));
    ctx.lineTo(sx, this.snap(yBeam));
    ctx.stroke();
  }

  beams(x1, x2, beamY, count) {
    const ctx = this.ctx;
    ctx.fillStyle = this.color;
    for (let b = 0; b < count; b++) {
      ctx.fillRect(this.snap(x1), this.snap(beamY + b * this.beamGap),
                   x2 - x1, this.beamTh);
    }
  }

  // One beam at a given level (0 = primary, 1 = secondary, …).
  beamAt(x1, x2, beamY, level) {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.snap(x1), this.snap(beamY + level * this.beamGap),
                      x2 - x1, this.beamTh);
  }

  // Fractional (stub) beam on an isolated note, pointing toward its group.
  beamStub(sx, beamY, level, right) {
    const len = 7;
    this.beamAt(right ? sx : sx - len, right ? sx + len : sx, beamY, level);
  }

  rest(x, beams, beamY, baseY) {
    const midY = (beamY + baseY) / 2 + this.restG * 0.30;
    const glyph = GLYPH.rest[beams] || GLYPH.rest[2]; // fall back to 16th rest
    this.glyph(glyph, this.snap(x), this.snap(midY), this.restG);
  }

  // A lone (un-beamable) note gets a flag hanging from the stem top. Sized to
  // the actual stem length (× 0.8) so it stays proportional on the shorter
  // triplet stems instead of looking oversized.
  flag(x, beamY, beams) {
    const size = (this.baseY - beamY) * 0.8;
    this.glyph(GLYPH.flag[beams] || GLYPH.flag[1],
               this.stemXof(x), this.snap(beamY), size, 'left');
  }

  bracket(x1, x2, beamY, n = 3) {
    const ctx = this.ctx, by = this.snap(beamY - this.bracketGap), tick = 4;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.snap(x1 - 2), by + tick);
    ctx.lineTo(this.snap(x1 - 2), by);
    ctx.lineTo(this.snap(x2 + 2), by);
    ctx.lineTo(this.snap(x2 + 2), by + tick);
    ctx.stroke();
    this.glyph(GLYPH.tuplet(n), this.snap((x1 + x2) / 2), by - 1, this.tupG, 'center', 'bottom');
  }

  // ── Generic beamed group ──────────────────────────────────────────────────
  // spec: { n, spacing, beams, pattern?, triplet?, stemLen?, rightPad? }
  compose(spec) {
    const { n, spacing } = spec;
    // Shift by the beat unit: in x/8 a "beat" is an eighth, so everything
    // gets one more beam; in x/2 one fewer (quarters → halves), etc.
    const beamCount = spec.beams + this.shift;
    const width = this.pad + (n - 1) * spacing + (spec.rightPad ?? this.pad);
    this.setup(width);

    const baseY = this.baseY;
    const stemLen = this.stemFor(beamCount);
    const beamY = spec.triplet
      ? baseY - this.tStem - Math.max(0, beamCount - 2) * this.beamGap
      : baseY - stemLen;

    const xs = [];
    for (let i = 0; i < n; i++) xs.push(this.pad + i * spacing);

    // Track which positions sound (default: all).
    const sounding = [];
    xs.forEach((x, i) => {
      if (!spec.pattern || spec.pattern[i]) {
        sounding.push(i);
        this.note(x, baseY, beamY, beamCount);
      } else {
        this.rest(x, beamCount, beamY, baseY);
      }
    });

    // Beaming for the simple groups compose() handles (full patterns, or ≤1
    // beam): a single lone note takes a flag; otherwise draw `beamCount` beams
    // across the sounding span. Gap-aware secondary stubs live in _beamNotes
    // (used by _rhythmGroup for the 16r patterns).
    if (beamCount > 0) {
      if (sounding.length === 1) {
        this.flag(xs[sounding[0]], beamY, beamCount);
      } else if (sounding.length >= 2) {
        this.beams(this.stemXof(xs[sounding[0]]),
                   this.stemXof(xs[sounding[sounding.length - 1]]), beamY, beamCount);
      }
    }
    if (spec.triplet) {
      this.bracket(this.stemXof(xs[0]), this.stemXof(xs[n - 1]), beamY, spec.tupletN || 3);
    }
    return this.canvas.toDataURL();
  }

  // Render a rhythm from an ONSET pattern using note durations: a silent slot
  // lengthens the preceding note (no rest), so e.g. [T,F,T,T] is 8th+16th+16th,
  // not 16th+rest+16th+16th. Only a LEADING silence (nothing to lengthen)
  // becomes a rest. Each note's beam count follows its duration.
  _rhythmGroup(pattern, n, spacing, maxBeams) {
    maxBeams += this.shift; // beat-unit shift (see compose)
    this.setup(this.pad + (n - 1) * spacing + this.pad);
    const baseY = this.baseY, beamY = baseY - this.stemFor(maxBeams);
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(this.pad + i * spacing);

    const onsets = [];
    for (let i = 0; i < n; i++) if (pattern[i]) onsets.push(i);
    if (!onsets.length) return this.canvas.toDataURL();

    // Leading silence → a rest spanning it.
    if (onsets[0] > 0) this.rest(xs[0], this._beamsForDur(onsets[0], maxBeams), beamY, baseY);

    // Each note lasts until the next onset (or the end of the group).
    const notes = onsets.map((pos, k) => {
      const dur = (k + 1 < onsets.length ? onsets[k + 1] : n) - pos;
      return { pos, dur, beams: this._beamsForDur(dur, maxBeams) };
    });

    notes.forEach(nt => {
      this.note(xs[nt.pos], baseY, beamY, nt.beams);
      if (nt.dur === 3) this.dot(xs[nt.pos], baseY); // dotted (e.g. dotted eighth)
    });

    this._beamNotes(notes, xs, beamY);
    return this.canvas.toDataURL();
  }

  // Beam count for a note of `dur` sixteenth-slots: 1→16th(2 beams), 2→8th(1),
  // 3→dotted-8th(1), 4→quarter(0).
  _beamsForDur(dur, maxBeams) {
    return Math.max(-2, maxBeams - Math.floor(Math.log2(dur)));
  }

  // Beam a sequence of notes (each with a `beams` count). The primary beam spans
  // all beamed notes; each higher-level beam joins only consecutive notes that
  // reach that level, and a note left alone at a level gets a fractional stub.
  _beamNotes(notes, xs, beamY) {
    const beamed = notes.filter(nt => nt.beams > 0);
    if (beamed.length === 0) return;
    if (beamed.length === 1) { this.flag(xs[beamed[0].pos], beamY, beamed[0].beams); return; }
    this.beamAt(this.stemXof(xs[beamed[0].pos]), this.stemXof(xs[beamed[beamed.length - 1].pos]), beamY, 0);
    const maxLevel = Math.max(...beamed.map(nt => nt.beams));
    for (let level = 1; level < maxLevel; level++) {
      for (let r = 0; r < beamed.length; ) {
        if (beamed[r].beams <= level) { r++; continue; }
        const s = r;
        while (r + 1 < beamed.length && beamed[r + 1].beams > level) r++;
        if (r > s) {
          this.beamAt(this.stemXof(xs[beamed[s].pos]), this.stemXof(xs[beamed[r].pos]), beamY, level);
        } else {
          this.beamStub(this.stemXof(xs[beamed[s].pos]), beamY, level, s === 0);
        }
        r++;
      }
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  // beatUnit: the time-signature denominator. Symbols are drawn relative to
  // the beat note — e.g. the plain beat is ♩ in x/4 but ♪ in x/8.
  render(sub, beatUnit = 4) {
    this.shift = Math.round(Math.log2(beatUnit / 4)) || 0;
    switch (sub.id) {
      case 'q':    return this.compose({ n: 1, spacing: 0,  beams: 0 });
      case '8':    return this.compose({ n: 2, spacing: 16, beams: 1 });
      case '8r1':  return this.compose({ n: 2, spacing: 16, beams: 1, pattern: [false, true] });
      case '8t':   return this.compose({ n: 3, spacing: 15, beams: 1, triplet: true });
      case '16':   return this.compose({ n: 4, spacing: 12, beams: 2 });
      case '16t':  return this.compose({ n: 6, spacing: 11, beams: 2, triplet: true, tupletN: 6 });
      case '32':   return this.compose({ n: 8, spacing: 9,  beams: 3 });
      case 'd8':   return this._rhythmGroup([true, false, false, true], 4, 8, 2);
      case '16r1': return this._rhythmGroup([false, true, true, true], 4, 12, 2);
      case '16r2': return this._rhythmGroup([true, false, true, true], 4, 12, 2);
      case '16r3': return this._rhythmGroup([true, true, false, true], 4, 12, 2);
      case '16r4': return this._rhythmGroup([true, true, true, false], 4, 12, 2);
      case '8tr1':  return this.compose({ n: 3, spacing: 15, beams: 1, triplet: true, pattern: [false, true, true] });
      case '8tr2':  return this.compose({ n: 3, spacing: 15, beams: 1, triplet: true, pattern: [true, false, true] });
      case '8tr3':  return this.compose({ n: 3, spacing: 15, beams: 1, triplet: true, pattern: [true, true, false] });
      case '8tr13': return this.compose({ n: 3, spacing: 15, beams: 1, triplet: true, pattern: [false, true, false] });
      case '8tr12': return this.compose({ n: 3, spacing: 15, beams: 1, triplet: true, pattern: [false, false, true] });
      default:     return this.compose({ n: 1, spacing: 0, beams: 0 });
    }
  }
}
