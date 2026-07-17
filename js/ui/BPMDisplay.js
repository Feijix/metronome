import { BPM_CONSTANTS, TEMPO_MARKINGS } from '../config/constants.js';

const START_ANGLE       = (2 * Math.PI) / 3;
const ARC_SPAN          = (5 * Math.PI) / 3;
const DRAG_SENSITIVITY  = 28 * Math.PI;   // 14 full rotations = full BPM range

export class BPMDisplay {
  constructor(stateManager, elements) {
    this.state    = stateManager;
    this.elements = elements;
    this.canvas   = elements.rotaryCanvas;
    this.ctx      = this.canvas.getContext('2d');
    this.dragging = false;
    this.lastAngle    = 0;
    this.bpmAccum     = 0;
    this.dialSize     = this.computeDialSize();
    this.dotAngle     = this.bpmToAngle(stateManager.getBPM());
    this.repeatTimeout  = null;
    this.repeatInterval = null;

    this.initCanvas();
    this.bindEvents();
    this.state.subscribe('bpm', value => this.updateDisplay(value));
    window.addEventListener('themechange', () => this.draw(this.state.getBPM()));
    this.updateDisplay(this.state.getBPM());
  }

  computeDialSize() {
    // Scale with screen width AND height so the dial shrinks on short screens;
    // floor at 150px for legibility. Cap is 220px on phones but grows to 300px
    // on tablets/large screens so the dial doesn't look tiny.
    const byWidth  = window.innerWidth  * 0.57;
    const byHeight = window.innerHeight * 0.28;
    const cap = Math.min(window.innerWidth, window.innerHeight) >= 700 ? 300 : 220;
    return Math.max(150, Math.min(cap, Math.floor(Math.min(byWidth, byHeight))));
  }

  initCanvas() {
    this.applyCanvasSize();
    window.addEventListener('resize', () => {
      this.dialSize = this.computeDialSize();
      this.applyCanvasSize();
      this.draw(this.state.getBPM());
    });
  }

  applyCanvasSize() {
    const s   = this.dialSize;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width        = s * dpr;
    this.canvas.height       = s * dpr;
    this.canvas.style.width  = s + 'px';
    this.canvas.style.height = s + 'px';
    // Keep container in sync so the centred text overlay stays aligned
    const container = this.canvas.parentElement;
    if (container) {
      container.style.width  = s + 'px';
      container.style.height = s + 'px';
    }
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    const { bpmUp, bpmDown } = this.elements;
    if (bpmUp)   bpmUp.addEventListener('pointerdown',   () => { this.nudge(1);  this.scheduleRepeat(1);  });
    if (bpmDown) bpmDown.addEventListener('pointerdown', () => { this.nudge(-1); this.scheduleRepeat(-1); });
    document.addEventListener('pointerup',     () => this.stopRepeat());
    document.addEventListener('pointercancel', () => this.stopRepeat());

    this.canvas.addEventListener('touchstart', e => {
      this.dragging  = true;
      this.lastAngle = this.pointerAngle(e.touches[0]);
      this.bpmAccum  = 0;
    }, { passive: true });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this.dragging) return;
      this.applyDelta(this.pointerAngle(e.touches[0]));
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => { this.dragging = false; });

    this.canvas.addEventListener('mousedown', e => {
      this.dragging  = true;
      this.lastAngle = this.pointerAngle(e);
      this.bpmAccum  = 0;
    });
    document.addEventListener('mousemove', e => {
      if (!this.dragging) return;
      this.applyDelta(this.pointerAngle(e));
    });
    document.addEventListener('mouseup', () => { this.dragging = false; });
  }

  nudge(dir) {
    const prev   = this.state.getBPM();
    const next   = Math.max(BPM_CONSTANTS.MIN, Math.min(BPM_CONSTANTS.MAX, prev + dir));
    const actual = next - prev;
    if (actual === 0) return;
    // Update dotAngle BEFORE setBPM so the subscriber-triggered draw already
    // sees the new position, giving the correct visual direction.
    this.dotAngle += actual * DRAG_SENSITIVITY / (BPM_CONSTANTS.MAX - BPM_CONSTANTS.MIN);
    this.state.setBPM(next);
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
    this.repeatTimeout  = null;
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

    this.dotAngle  += delta;
    this.bpmAccum  += delta * (BPM_CONSTANTS.MAX - BPM_CONSTANTS.MIN) / DRAG_SENSITIVITY;
    const step = Math.trunc(this.bpmAccum);
    if (step !== 0) {
      this.bpmAccum -= step;
      this.state.setBPM(this.state.getBPM() + step);
      if (navigator.vibrate) navigator.vibrate(6);
    }
    // Redraw on every pointer move for fluid dot motion (not only on BPM integer steps)
    this.draw(this.state.getBPM());
  }

  draw(bpm) {
    const s     = this.dialSize;
    const ctx   = this.ctx;
    const cx    = s / 2;
    const cy    = s / 2;
    const ringR = s * 0.445;
    const dotR  = s * 0.048;

    ctx.clearRect(0, 0, s, s);

    const style       = getComputedStyle(document.documentElement);
    const borderColor = style.getPropertyValue('--border').trim() || '#334155';
    const accentColor = style.getPropertyValue('--accent').trim() || '#06b6d4';

    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, 2 * Math.PI);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      cx + ringR * Math.cos(this.dotAngle),
      cy + ringR * Math.sin(this.dotAngle),
      dotR, 0, 2 * Math.PI
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
