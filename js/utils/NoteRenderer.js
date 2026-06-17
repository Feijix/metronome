export class NoteRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.color = '#ffffff';

    // Geometry at CSS 1× pixels — all canvases share H so CSS height:Xpx
    // scales every symbol identically.
    this.H    = 42;   // CSS canvas height (all symbols)
    this.baseY = 32;  // note-head Y for regular symbols
    this.tBaseY = 33; // note-head Y for triplets (shorter stem, bracket fits in H)
    this.tStem  = 18; // triplet stem length  (beamY = 33-18 = 15)

    this.hw = 7;     // note-head width
    this.hh = 5;     // note-head height
    this.ha = -0.25; // note-head tilt
    this.sw = 1.0;   // stem stroke width  (1 CSS px → exactly N device px)
    this.sl = 24;    // stem length (regular)
    this.bh = 1.5;   // beam thickness
    this.bg = 5.0;   // beam center-to-center spacing
  }

  get dpr() { return Math.min(3, Math.ceil(window.devicePixelRatio || 1)); }

  // Snap a CSS-pixel coordinate to the nearest device-pixel boundary so that
  // strokes land on whole device pixels and look crisp.
  snap(v) { const d = this.dpr; return Math.round(v * d) / d; }

  setup(cssW) {
    const s = this.dpr;
    this.canvas.width  = Math.round(cssW * s);
    this.canvas.height = Math.round(this.H  * s);
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
    this.ctx.clearRect(0, 0, cssW, this.H);
  }

  // ── Primitives ─────────────────────────────────────────────────────────

  head(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.snap(x), this.snap(y));
    ctx.rotate(this.ha);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.hw / 2, this.hh / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  dot(x, y) {
    this.ctx.beginPath();
    this.ctx.arc(this.snap(x + this.hw / 2 + 3), this.snap(y - 1.5), 1.5, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  stem(x, y, len = this.sl) {
    const ctx = this.ctx;
    const sx = this.snap(x + this.hw / 2 - 0.5);
    const sy = this.snap(y), ey = this.snap(y - len);
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.sw;
    ctx.lineCap = 'round';
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, ey);
    ctx.stroke();
  }

  sx(x) { return this.snap(x + this.hw / 2 - 0.5); }

  beams(x1, x2, y, count, bh = this.bh, bg = this.bg) {
    const ctx = this.ctx;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = bh;
    ctx.lineCap = 'butt'; // flat ends — cleaner at beam tips
    for (let i = 0; i < count; i++) {
      const cy = this.snap(y + bh / 2 + i * bg);
      ctx.beginPath();
      ctx.moveTo(this.snap(x1), cy);
      ctx.lineTo(this.snap(x2), cy);
      ctx.stroke();
    }
  }

  bracket(x1, x2, topY) {
    const ctx = this.ctx;
    const ty = this.snap(topY), tick = 4;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.snap(x1), ty + tick);
    ctx.lineTo(this.snap(x1), ty);
    ctx.lineTo(this.snap(x2), ty);
    ctx.lineTo(this.snap(x2), ty + tick);
    ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.font = 'bold 7px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('3', (x1 + x2) / 2, ty - 1);
  }

  // ── Rest glyphs ─────────────────────────────────────────────────────────

  // Draw one "flag" unit: filled dot at (rx, top), bezier diagonal to (lx, bot).
  _restFlag(ctx, rx, lx, top, bot) {
    const dotR = 2;
    ctx.beginPath();
    ctx.arc(this.snap(rx), this.snap(top), dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.snap(rx), this.snap(top + dotR + 1));
    ctx.quadraticCurveTo(
      this.snap(rx - 1), this.snap((top + bot) / 2),
      this.snap(lx), this.snap(bot)
    );
    ctx.stroke();
  }

  // 8th rest: dot + curved diagonal + serif. baseY must be the actual
  // note-head baseline for the calling context (regular or triplet).
  draw8thRest(x, beamY, baseY = this.baseY) {
    const ctx = this.ctx;
    const avail = baseY - beamY;
    const gTop  = beamY + Math.max(4, avail * 0.18);
    const gBot  = baseY - Math.max(3, avail * 0.12);
    const rx    = x + 3;
    const lx    = x - 2;

    ctx.save();
    ctx.fillStyle = ctx.strokeStyle = this.color;
    ctx.lineCap   = 'round';
    ctx.lineWidth = 1.4;

    this._restFlag(ctx, rx, lx, gTop, gBot);

    // serif at bottom-left
    ctx.beginPath();
    ctx.moveTo(this.snap(lx - 3), this.snap(gBot));
    ctx.lineTo(this.snap(lx + 3), this.snap(gBot));
    ctx.stroke();

    ctx.restore();
  }

  // 16th rest: two stacked flags + serif.
  draw16thRest(x, beamY, baseY = this.baseY) {
    const ctx   = this.ctx;
    const avail = baseY - beamY;
    const gTop  = beamY + Math.max(3, avail * 0.12);
    const gBot  = baseY - Math.max(2, avail * 0.08);
    const gMid  = (gTop + gBot) / 2;
    const rx    = x + 3;
    const lx    = x - 2;

    ctx.save();
    ctx.fillStyle = ctx.strokeStyle = this.color;
    ctx.lineCap   = 'round';
    ctx.lineWidth = 1.4;

    this._restFlag(ctx, rx, lx, gTop, gMid - 1);
    this._restFlag(ctx, rx, lx, gMid + 2, gBot);

    // serif at bottom-left
    ctx.beginPath();
    ctx.moveTo(this.snap(lx - 3), this.snap(gBot));
    ctx.lineTo(this.snap(lx + 3), this.snap(gBot));
    ctx.stroke();

    ctx.restore();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  render(sub) {
    switch (sub.id) {
      case 'q':    return this._quarter();
      case '8':    return this._eighth();
      case '8t':   return this._eighthTriplet();
      case '16':   return this._sixteenth();
      case '16t':  return this._sixteenthTriplet();
      case '32':   return this._thirtySecond();
      case 'd8':   return this._dottedEighth();
      case '16r1': return this._partial16(0);
      case '16r2': return this._partial16(1);
      case '16r3': return this._partial16(2);
      case '16r4': return this._partial16(3);
      case '8tr1':  return this._partialTriplet([0]);
      case '8tr2':  return this._partialTriplet([1]);
      case '8tr3':  return this._partialTriplet([2]);
      case '8tr13': return this._partialTriplet([0, 2]);
      case '8tr12': return this._partialTriplet([0, 1]);
      default:     return this._quarter();
    }
  }

  // ── Symbol renderers ────────────────────────────────────────────────────

  _quarter() {
    this.setup(22);
    this.head(11, this.baseY);
    this.stem(11, this.baseY);
    return this.canvas.toDataURL();
  }

  _eighth() {
    const sp = 16, x0 = 10;
    this.setup(x0 + sp + this.hw + 4);
    const y = this.baseY, beamY = y - this.sl;
    this.head(x0, y);      this.stem(x0, y);
    this.head(x0 + sp, y); this.stem(x0 + sp, y);
    this.beams(this.sx(x0), this.sx(x0 + sp), beamY, 1);
    return this.canvas.toDataURL();
  }

  _sixteenth() {
    const sp = 12, x0 = 10, n = 4;
    this.setup(x0 + (n - 1) * sp + this.hw + 4);
    const y = this.baseY, beamY = y - this.sl;
    for (let i = 0; i < n; i++) { this.head(x0 + i * sp, y); this.stem(x0 + i * sp, y); }
    this.beams(this.sx(x0), this.sx(x0 + (n - 1) * sp), beamY, 2);
    return this.canvas.toDataURL();
  }

  _thirtySecond() {
    const sp = 9, x0 = 10, n = 8, sl = 20;
    this.setup(x0 + (n - 1) * sp + this.hw + 4);
    const y = this.baseY, beamY = y - sl;
    for (let i = 0; i < n; i++) { this.head(x0 + i * sp, y); this.stem(x0 + i * sp, y, sl); }
    this.beams(this.sx(x0), this.sx(x0 + (n - 1) * sp), beamY, 3, this.bh, 4.5);
    return this.canvas.toDataURL();
  }

  _dottedEighth() {
    const x0 = 10, x1 = x0 + 22;
    this.setup(x1 + this.hw + 10);
    const y = this.baseY, beamY = y - this.sl;
    this.head(x0, y);  this.stem(x0, y);
    this.head(x1, y);  this.stem(x1, y);
    this.beams(this.sx(x0), this.sx(x1), beamY, 1);
    this.beams(this.sx(x1) - 7, this.sx(x1), beamY + this.bg, 1);
    this.dot(x0, y);
    return this.canvas.toDataURL();
  }

  _tripletSetup(cssW) {
    this.setup(cssW);
    return { baseY: this.tBaseY, stemLen: this.tStem, beamY: this.tBaseY - this.tStem };
  }

  _eighthTriplet() {
    const sp = 15, x0 = 12, n = 3;
    const { baseY, stemLen, beamY } = this._tripletSetup(x0 + (n - 1) * sp + this.hw + 6);
    for (let i = 0; i < n; i++) { this.head(x0 + i * sp, baseY); this.stem(x0 + i * sp, baseY, stemLen); }
    const sx1 = this.sx(x0), sx2 = this.sx(x0 + (n - 1) * sp);
    this.beams(sx1, sx2, beamY, 1);
    this.bracket(sx1 - 2, sx2 + 2, beamY - 6);
    return this.canvas.toDataURL();
  }

  _sixteenthTriplet() {
    const sp = 11, x0 = 11, n = 6;
    const { baseY, stemLen, beamY } = this._tripletSetup(x0 + (n - 1) * sp + this.hw + 6);
    for (let i = 0; i < n; i++) { this.head(x0 + i * sp, baseY); this.stem(x0 + i * sp, baseY, stemLen); }
    const sx1 = this.sx(x0), sx2 = this.sx(x0 + (n - 1) * sp);
    this.beams(sx1, sx2, beamY, 2);
    this.bracket(sx1 - 2, sx2 + 2, beamY - 6);
    return this.canvas.toDataURL();
  }

  _partial16(silentPos) {
    const sp = 12, x0 = 10, n = 4;
    this.setup(x0 + (n - 1) * sp + this.hw + 4);
    const y = this.baseY, beamY = y - this.sl;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * sp;
      if (i === silentPos) {
        this.draw16thRest(x, beamY, y);
      } else {
        this.head(x, y);
        this.stem(x, y);
      }
    }
    this.beams(this.sx(x0), this.sx(x0 + (n - 1) * sp), beamY, 2);
    return this.canvas.toDataURL();
  }

  _partialTriplet(silentPositions) {
    const sp = 15, x0 = 12, n = 3;
    const { baseY, stemLen, beamY } = this._tripletSetup(x0 + (n - 1) * sp + this.hw + 6);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * sp;
      if (silentPositions.includes(i)) {
        this.draw8thRest(x, beamY, baseY);
      } else {
        this.head(x, baseY);
        this.stem(x, baseY, stemLen);
      }
    }
    const sx1 = this.sx(x0), sx2 = this.sx(x0 + (n - 1) * sp);
    this.beams(sx1, sx2, beamY, 1);
    this.bracket(sx1 - 2, sx2 + 2, beamY - 6);
    return this.canvas.toDataURL();
  }
}
