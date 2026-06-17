import { BPM_CONSTANTS, TEMPO_MARKINGS } from '../config/constants.js';

// Arc spans 300° (5π/3 rad), gap at the bottom.
// Canvas angles: 0 = right, clockwise. 7 o'clock = 120°, 5 o'clock = 60° + full revolution.
const START_ANGLE = (2 * Math.PI) / 3;          // 120° — 7 o'clock
const END_ANGLE   = START_ANGLE + (5 * Math.PI) / 3; // + 300° — 5 o'clock
const ARC_SPAN    = (5 * Math.PI) / 3;           // 300° — visual only
const DRAG_SENSITIVITY = 28 * Math.PI;           // 14 full rotations = full BPM range
const DIAL_SIZE   = 220;

export class BPMDisplay {
  constructor(stateManager, elements) {
    this.state = stateManager;
    this.elements = elements;
    this.canvas = elements.rotaryCanvas;
    this.ctx = this.canvas.getContext('2d');
    this.dragging = false;
    this.lastAngle = 0;
    this.bpmAccum = 0;
    this.dotAngle = this.bpmToAngle(stateManager.getBPM());
    this.repeatTimeout = null;
    this.repeatInterval = null;

    this.initCanvas();
    this.bindEvents();
    this.state.subscribe('bpm', value => this.updateDisplay(value));
    window.addEventListener('themechange', () => this.draw(this.state.getBPM()));
    this.updateDisplay(this.state.getBPM());
  }

  initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = DIAL_SIZE * dpr;
    this.canvas.height = DIAL_SIZE * dpr;
    this.canvas.style.width  = DIAL_SIZE + 'px';
    this.canvas.style.height = DIAL_SIZE + 'px';
    this.ctx.scale(dpr, dpr);
    window.addEventListener('resize', () => {
      const d = window.devicePixelRatio || 1;
      this.canvas.width  = DIAL_SIZE * d;
      this.canvas.height = DIAL_SIZE * d;
      this.ctx.scale(d, d);
      this.draw(this.state.getBPM());
    });
  }

  bindEvents() {
    const { bpmUp, bpmDown } = this.elements;
    if (bpmUp) {
      bpmUp.addEventListener('pointerdown', () => { this.nudge(1); this.scheduleRepeat(1); });
    }
    if (bpmDown) {
      bpmDown.addEventListener('pointerdown', () => { this.nudge(-1); this.scheduleRepeat(-1); });
    }
    document.addEventListener('pointerup',     () => this.stopRepeat());
    document.addEventListener('pointercancel', () => this.stopRepeat());

    this.canvas.addEventListener('touchstart', e => {
      this.dragging = true;
      this.lastAngle = this.pointerAngle(e.touches[0]);
      this.bpmAccum = 0;
    }, { passive: true });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this.dragging) return;
      const angle = this.pointerAngle(e.touches[0]);
      this.applyDelta(angle);
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => { this.dragging = false; });

    this.canvas.addEventListener('mousedown', e => {
      this.dragging = true;
      this.lastAngle = this.pointerAngle(e);
      this.bpmAccum = 0;
    });
    document.addEventListener('mousemove', e => {
      if (!this.dragging) return;
      const angle = this.pointerAngle(e);
      this.applyDelta(angle);
    });
    document.addEventListener('mouseup', () => { this.dragging = false; });
  }

  nudge(dir) {
    const prev = this.state.getBPM();
    this.state.setBPM(prev + dir);
    const actual = this.state.getBPM() - prev;
    this.dotAngle += actual * DRAG_SENSITIVITY / (BPM_CONSTANTS.MAX - BPM_CONSTANTS.MIN);
    if (navigator.vibrate) navigator.vibrate(6);
  }

  scheduleRepeat(dir) {
    this.repeatTimeout = setTimeout(() => {
      this.repeatInterval = setInterval(() => this.nudge(dir), 80);
    }, 400);
  }

  stopRepeat() {
    clearTimeout(this.repeatTimeout);
    clearInterval(this.repeatInterval);
    this.repeatTimeout = null;
    this.repeatInterval = null;
  }

  pointerAngle(pointer) {
    const rect = this.canvas.getBoundingClientRect();
    return Math.atan2(
      pointer.clientY - (rect.top  + rect.height / 2),
      pointer.clientX - (rect.left + rect.width  / 2)
    );
  }

  applyDelta(angle) {
    let delta = angle - this.lastAngle;
    if (delta >  Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    this.lastAngle = angle;

    this.dotAngle += delta;
    this.bpmAccum += delta * (BPM_CONSTANTS.MAX - BPM_CONSTANTS.MIN) / DRAG_SENSITIVITY;
    const step = Math.trunc(this.bpmAccum);
    if (step !== 0) {
      this.bpmAccum -= step;
      this.state.setBPM(this.state.getBPM() + step);
      if (navigator.vibrate) navigator.vibrate(6);
    }
  }

  draw(bpm) {
    const ctx = this.ctx;
    const cx    = DIAL_SIZE / 2;
    const cy    = DIAL_SIZE / 2;
    const ringR = 98;

    ctx.clearRect(0, 0, DIAL_SIZE, DIAL_SIZE);

    const style = getComputedStyle(document.documentElement);
    const borderColor = style.getPropertyValue('--border').trim() || '#334155';
    const accentColor = style.getPropertyValue('--accent').trim() || '#06b6d4';

    // Full circle — thin contour matching button borders
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, 2 * Math.PI);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Moving dot — free rotation, tracks finger 1:1
    ctx.beginPath();
    ctx.arc(
      cx + ringR * Math.cos(this.dotAngle),
      cy + ringR * Math.sin(this.dotAngle),
      10.5, 0, 2 * Math.PI
    );
    ctx.fillStyle = accentColor;
    ctx.fill();
  }

  bpmToAngle(bpm) {
    const fraction = Math.max(0, Math.min(1,
      (bpm - BPM_CONSTANTS.MIN) / (BPM_CONSTANTS.MAX - BPM_CONSTANTS.MIN)
    ));
    return START_ANGLE + fraction * ARC_SPAN;
  }

  updateDisplay(bpm) {
    this.draw(bpm);
    if (this.elements.bpmDisplay) this.elements.bpmDisplay.textContent = bpm;
    if (this.elements.tempoName)  this.elements.tempoName.textContent  = this.getTempoName(bpm);
  }

  getTempoName(bpm) {
    for (const m of TEMPO_MARKINGS) {
      if (bpm <= m.max) return m.name;
    }
    return TEMPO_MARKINGS[TEMPO_MARKINGS.length - 1].name;
  }

  destroy() {}
}
