export class DOMHelpers {
  static getAllElements() {
    return {
      // BPM controls
      bpmDisplay: document.getElementById('bpm-display'),
      bpmUp: document.getElementById('bpm-up'),
      bpmDown: document.getElementById('bpm-down'),
      tapTempo: document.getElementById('tap-tempo'),

      // Visualizer
      beatsContainer: document.getElementById('beats-container'),
      modeDisplay: document.getElementById('mode-display'),
      barDisplay: document.getElementById('bar-display'),
      barTotal: document.getElementById('bar-total'),

      // Controls
      timeSig: document.getElementById('time-sig'),
      timeUp: document.getElementById('time-up'),
      timeDown: document.getElementById('time-down'),

      // Gap pattern
      clickBars: document.getElementById('click-bars'),
      clickUp: document.getElementById('click-up'),
      clickDown: document.getElementById('click-down'),
      gapBars: document.getElementById('gap-bars'),
      gapUp: document.getElementById('gap-up'),
      gapDown: document.getElementById('gap-down'),

      // Subdivisions
      subdivisionPills: document.querySelectorAll('.pill'),

      // Accents
      accentOne: document.getElementById('accent-one'),
      accentQuarters: document.getElementById('accent-quarters'),

      // Play button
      playBtn: document.getElementById('play-btn'),

      // PWA Install
      installPrompt: document.getElementById('install-prompt'),
      installBtn: document.getElementById('install-btn'),
      dismissBtn: document.getElementById('dismiss-btn')
    };
  }

  static preventDoubleClickZoom() {
    document.addEventListener('dblclick', (e) => {
      e.preventDefault();
    }, { passive: false });
  }
}
