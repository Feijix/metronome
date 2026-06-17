export class NoteRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.color = '#ffffff';

    this.noteHeadWidth = 9;
    this.noteHeadHeight = 7.5;   // rounder (was 6.5)
    this.noteHeadRotation = -0.2; // less tilt (was -0.35)
    this.stemWidth = 1.6;         // slightly thicker (was 1.2)
    this.stemLength = 24;
    this.beamThickness = 4;       // thicker (was 3.5)
    this.beamSpacing = 5;         // clear gap between beams (was 3.5)
  }

  render(sub) {
    switch (sub.id) {
      case 'q':    return this.renderQuarterNote();
      case '8':    return this.renderEighthNotes();
      case '8t':   return this.renderEighthTriplet();
      case '16':   return this.renderSixteenthNotes();
      case '16t':  return this.renderSixteenthTriplet();
      case '32':   return this.renderThirtySecondNotes();
      case 'd8':   return this.renderDottedEighthSixteenth();
      case '16r1': return this.renderPartial16(0);
      case '16r2': return this.renderPartial16(1);
      case '16r3': return this.renderPartial16(2);
      case '16r4': return this.renderPartial16(3);
      case '8tr1':  return this.renderPartialTriplet8([0]);
      case '8tr2':  return this.renderPartialTriplet8([1]);
      case '8tr3':  return this.renderPartialTriplet8([2]);
      case '8tr13': return this.renderPartialTriplet8([0, 2]);
      case '8tr12': return this.renderPartialTriplet8([0, 1]);
      default:     return this.renderQuarterNote();
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawNoteHead(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(this.noteHeadRotation);
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, this.noteHeadWidth / 2, this.noteHeadHeight / 2, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
    this.ctx.restore();
  }

  drawXNoteHead(x, y) {
    const s = 3.5;
    this.ctx.save();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 1.8;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(x - s, y - s);
    this.ctx.lineTo(x + s, y + s);
    this.ctx.moveTo(x + s, y - s);
    this.ctx.lineTo(x - s, y + s);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawAugmentationDot(x, y) {
    this.ctx.beginPath();
    this.ctx.arc(x + this.noteHeadWidth / 2 + 3.5, y - 1.5, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  drawStem(x, y) {
    const stemX = x + (this.noteHeadWidth / 2 - 0.5);
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.stemWidth;
    this.ctx.lineCap = 'round';  // rounded cap at top (was 'butt')
    this.ctx.moveTo(stemX, y);
    this.ctx.lineTo(stemX, y - this.stemLength);
    this.ctx.stroke();
  }

  // Beams drawn as strokes with round caps for a clean, Outfit-like look
  drawBeams(x1, x2, y, beamCount = 1) {
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.beamThickness;
    this.ctx.lineCap = 'round';
    for (let i = 0; i < beamCount; i++) {
      const cy = y + this.beamThickness / 2 + i * this.beamSpacing;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, cy);
      this.ctx.lineTo(x2, cy);
      this.ctx.stroke();
    }
  }

  drawTripletBracket(x1, x2, y) {
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 1;
    this.ctx.lineCap = 'round';
    const bracketHeight = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y + bracketHeight);
    this.ctx.lineTo(x1, y);
    this.ctx.lineTo(x2, y);
    this.ctx.lineTo(x2, y + bracketHeight);
    this.ctx.stroke();
    this.ctx.fillStyle = this.color;
    this.ctx.font = 'bold 9px Outfit, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('3', (x1 + x2) / 2, y - 1);
  }

  // ── Standard subdivisions ───────────────────────────────────────────

  renderQuarterNote() {
    this.canvas.width = 24;
    this.canvas.height = 42;
    this.clear();
    const x = 12, y = 32;
    this.drawNoteHead(x, y);
    this.drawStem(x, y);
    return this.canvas.toDataURL();
  }

  renderEighthNotes() {
    this.canvas.width = 42;
    this.canvas.height = 42;
    this.clear();
    const baseY = 32, spacing = 18, startX = 12;
    for (let i = 0; i < 2; i++) this.drawNoteHead(startX + i * spacing, baseY);
    for (let i = 0; i < 2; i++) this.drawStem(startX + i * spacing, baseY);
    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = startX + spacing + (this.noteHeadWidth / 2 - 0.5);
    this.drawBeams(stemX1, stemX2, baseY - this.stemLength, 1);
    return this.canvas.toDataURL();
  }

  renderEighthTriplet() {
    this.canvas.width = 58;
    this.canvas.height = 52;
    this.clear();
    const baseY = 38, spacing = 16, startX = 13;
    for (let i = 0; i < 3; i++) this.drawNoteHead(startX + i * spacing, baseY);
    for (let i = 0; i < 3; i++) this.drawStem(startX + i * spacing, baseY);
    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = startX + 2 * spacing + (this.noteHeadWidth / 2 - 0.5);
    const beamY = baseY - this.stemLength;
    this.drawBeams(stemX1, stemX2, beamY, 1);
    this.drawTripletBracket(stemX1 - 2, stemX2 + 2, beamY - 7);
    return this.canvas.toDataURL();
  }

  renderSixteenthNotes() {
    this.canvas.width = 62;
    this.canvas.height = 42;
    this.clear();
    const baseY = 32, spacing = 14, startX = 12;
    for (let i = 0; i < 4; i++) this.drawNoteHead(startX + i * spacing, baseY);
    for (let i = 0; i < 4; i++) this.drawStem(startX + i * spacing, baseY);
    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = startX + 3 * spacing + (this.noteHeadWidth / 2 - 0.5);
    this.drawBeams(stemX1, stemX2, baseY - this.stemLength, 2);
    return this.canvas.toDataURL();
  }

  renderSixteenthTriplet() {
    this.canvas.width = 82;
    this.canvas.height = 52;
    this.clear();
    const baseY = 38, spacing = 12, startX = 12;
    for (let i = 0; i < 6; i++) this.drawNoteHead(startX + i * spacing, baseY);
    for (let i = 0; i < 6; i++) this.drawStem(startX + i * spacing, baseY);
    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = startX + 5 * spacing + (this.noteHeadWidth / 2 - 0.5);
    const beamY = baseY - this.stemLength;
    this.drawBeams(stemX1, stemX2, beamY, 2);
    this.drawTripletBracket(stemX1 - 2, stemX2 + 2, beamY - 7);
    return this.canvas.toDataURL();
  }

  renderThirtySecondNotes() {
    this.canvas.width = 90;
    this.canvas.height = 46;
    this.clear();
    const baseY = 36, spacing = 10, startX = 12;
    for (let i = 0; i < 8; i++) this.drawNoteHead(startX + i * spacing, baseY);
    for (let i = 0; i < 8; i++) this.drawStem(startX + i * spacing, baseY);
    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = startX + 7 * spacing + (this.noteHeadWidth / 2 - 0.5);
    this.drawBeams(stemX1, stemX2, baseY - this.stemLength, 3);
    return this.canvas.toDataURL();
  }

  renderDottedEighthSixteenth() {
    this.canvas.width = 52;
    this.canvas.height = 42;
    this.clear();

    const baseY = 32;
    const startX = 10;
    const note2X = startX + 24;

    this.drawNoteHead(startX, baseY);
    this.drawNoteHead(note2X, baseY);
    this.drawStem(startX, baseY);
    this.drawStem(note2X, baseY);

    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = note2X + (this.noteHeadWidth / 2 - 0.5);
    const beamY = baseY - this.stemLength;

    this.drawBeams(stemX1, stemX2, beamY, 1);
    // Partial secondary beam (right side only — makes 2nd note a 16th)
    this.drawBeams(stemX2 - 8, stemX2, beamY + this.beamSpacing, 1);

    this.drawAugmentationDot(startX, baseY);

    return this.canvas.toDataURL();
  }

  renderPartialTriplet8(silentPositions) {
    this.canvas.width = 58;
    this.canvas.height = 52;
    this.clear();

    const baseY = 38, spacing = 16, startX = 13;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * spacing;
      if (silentPositions.includes(i)) {
        this.drawXNoteHead(x, baseY);
      } else {
        this.drawNoteHead(x, baseY);
      }
      this.drawStem(x, baseY);
    }

    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = startX + 2 * spacing + (this.noteHeadWidth / 2 - 0.5);
    const beamY = baseY - this.stemLength;
    this.drawBeams(stemX1, stemX2, beamY, 1);
    this.drawTripletBracket(stemX1 - 2, stemX2 + 2, beamY - 7);

    return this.canvas.toDataURL();
  }

  renderPartial16(silentPos) {
    this.canvas.width = 62;
    this.canvas.height = 42;
    this.clear();

    const baseY = 32, spacing = 14, startX = 12;

    for (let i = 0; i < 4; i++) {
      const x = startX + i * spacing;
      if (i === silentPos) {
        this.drawXNoteHead(x, baseY);
      } else {
        this.drawNoteHead(x, baseY);
      }
      this.drawStem(x, baseY);
    }

    const stemX1 = startX + (this.noteHeadWidth / 2 - 0.5);
    const stemX2 = startX + 3 * spacing + (this.noteHeadWidth / 2 - 0.5);
    this.drawBeams(stemX1, stemX2, baseY - this.stemLength, 2);

    return this.canvas.toDataURL();
  }
}
