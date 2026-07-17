export class DOMHelpers {
  static getAllElements() {
    return {
      // BPM rotary dial + nudge buttons
      rotaryCanvas: document.getElementById('rotary-canvas'),
      bpmDisplay:   document.getElementById('bpm-display'),
      tempoName:    document.getElementById('tempo-name'),
      bpmUp:        document.getElementById('bpm-up'),
      bpmDown:      document.getElementById('bpm-down'),
      tapTempo:     document.getElementById('tap-tempo'),

      // Visualizer
      beatsContainer: document.getElementById('beats-container'),
      modeDisplay:    document.getElementById('mode-display'),
      barDisplay:     document.getElementById('bar-display'),
      barTotal:       document.getElementById('bar-total'),

      // Gap pattern wheels
      clickWheel: document.getElementById('click-wheel'),
      gapWheel:   document.getElementById('gap-wheel'),
      voiceToggle: document.getElementById('voice-toggle'),

      // Time signature picker
      timeSigBtn:     document.getElementById('time-sig-btn'),
      timeSigValue:   document.getElementById('time-sig-value'),
      timeSigPicker:  document.getElementById('time-sig-picker'),
      timeSigOptions: document.getElementById('time-sig-options'),

      // Subdivision picker
      subdivisionBtn:     document.getElementById('subdivision-btn'),
      subdivisionValue:   document.getElementById('subdivision-value'),
      subdivisionPicker:  document.getElementById('subdivision-picker'),
      subdivisionOptions: document.getElementById('subdivision-options'),

      // Play button
      playBtn: document.getElementById('play-btn'),

      // PWA Install
      installPrompt: document.getElementById('install-prompt'),
      installBtn:    document.getElementById('install-btn'),
      dismissBtn:    document.getElementById('dismiss-btn'),

      // Settings Panel
      settingsIcon:          document.getElementById('settings-icon'),
      settingsPanel:         document.getElementById('settings-panel'),
      settingsBackdrop:      document.getElementById('settings-backdrop'),
      settingsClose:         document.getElementById('settings-close'),
      soundOptions:          document.querySelectorAll('.sound-option'),
      settingsAccentOne:     document.getElementById('settings-accent-one'),
      settingsAccentQuarters:document.getElementById('settings-accent-quarters'),
      settingsFlash:         document.getElementById('settings-flash'),
      settingsVibrate:       document.getElementById('settings-vibrate'),
      settingsWakeLock:      document.getElementById('settings-wake-lock'),
      presetName:    document.getElementById('preset-name'),
      savePreset:    document.getElementById('save-preset'),
      deletePreset:  document.getElementById('delete-preset'),
      presetSelect:  document.getElementById('preset-select')
    };
  }

  static preventDoubleClickZoom() {
    document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  }
}
