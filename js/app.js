import { StateManager } from './core/StateManager.js';
import { MetronomeAudio } from './core/MetronomeAudio.js';
import { MetronomeScheduler } from './core/MetronomeScheduler.js';
import { TapTempo } from './features/TapTempo.js';
import { VoiceCounter } from './features/VoiceCounter.js';
import { BPMDisplay } from './ui/BPMDisplay.js';
import { BeatsVisualizer } from './ui/BeatsVisualizer.js';
import { SubdivisionControl } from './ui/SubdivisionControl.js';
import { GapPatternWheel } from './ui/GapPatternWheel.js';
import { TimeSignatureWheel } from './ui/TimeSignatureWheel.js';
import { PlayButton } from './ui/PlayButton.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { ScreenFlash } from './ui/ScreenFlash.js';
import { PWAInstaller } from './utils/PWAInstaller.js';
import { DOMHelpers } from './utils/DOMHelpers.js';
import { PresetManager } from './utils/PresetManager.js';
import { NativeBridge } from './utils/NativeBridge.js';

class GapMetronomeApp {
  constructor() {
    this.initializeCore();
    this.initializeUI();
    this.initializePWA();
    this.setupKeyboardShortcuts();
    this.setupAudioWarmup();
    this.setupBackgroundPlayback();
  }

  // Keep the metronome running with the screen off. On Android a
  // media-playback foreground service (started while playing) keeps the
  // process and audio alive; on return to the foreground make sure the
  // AudioContext is running again.
  setupBackgroundPlayback() {
    this.state.subscribe('playState', (playing) => {
      NativeBridge.call(playing ? 'startPlayback' : 'stopPlayback');
      if (playing) this.audio.resume();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.scheduler.isPlaying()) {
        this.audio.resume();
      }
    });
  }

  // Warm up the audio engine (create context + decode the current sample) on
  // the first user gesture so the very first click isn't clipped while loading.
  setupAudioWarmup() {
    const warm = () => this.audio.init();
    window.addEventListener('pointerdown', warm, { once: true });
    window.addEventListener('keydown', warm, { once: true });
  }

  initializeCore() {
    // Core instances
    this.state = new StateManager();
    this.audio = new MetronomeAudio();
    this.audio.setSoundType(this.state.getSoundType()); // restore persisted choice
    this.scheduler = new MetronomeScheduler(this.state, this.audio);
    this.tapTempo = new TapTempo(this.state, this.audio);
    this.voiceCounter = new VoiceCounter(this.state, this.audio);
  }

  initializeUI() {
    const elements = DOMHelpers.getAllElements();

    // Preset manager
    this.presetManager = new PresetManager(this.state);

    // UI Components
    this.bpmDisplay = new BPMDisplay(this.state, elements);
    this.visualizer = new BeatsVisualizer(
      this.state,
      elements.beatsContainer,
      elements.barDisplay,
      elements.barTotal,
      elements.modeDisplay
    );
    this.clickWheel = new GapPatternWheel(this.state, elements.clickWheel, 'click');
    this.gapWheel = new GapPatternWheel(this.state, elements.gapWheel, 'gap');
    this.timeSignatureWheel = new TimeSignatureWheel(this.state, elements);
    this.subdivisionWheel = new SubdivisionControl(this.state, elements);
    this.playButton = new PlayButton(this.scheduler, elements.playBtn);
    this.settingsPanel = new SettingsPanel(this.state, this.audio, this.presetManager, elements);
    this.screenFlash = new ScreenFlash(this.state);

    // Tap tempo button
    if (elements.tapTempo) {
      elements.tapTempo.addEventListener('click', () => this.tapTempo.handleTap());
    }

    // Spoken bar-count toggle (left of the Click wheel)
    if (elements.voiceToggle) {
      const syncVoiceBtn = () => {
        const on = this.state.getVoiceCount();
        elements.voiceToggle.classList.toggle('active', on);
        elements.voiceToggle.setAttribute('aria-pressed', String(on));
      };
      elements.voiceToggle.addEventListener('click', () => {
        this.state.setVoiceCount(!this.state.getVoiceCount());
        syncVoiceBtn();
      });
      syncVoiceBtn();
    }

    // Prevent double-click zoom
    DOMHelpers.preventDoubleClickZoom();

    // Initialize displays
    this.visualizer.init();
  }

  initializePWA() {
    const elements = DOMHelpers.getAllElements();
    this.pwaInstaller = new PWAInstaller(elements);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.playButton.toggle();
      } else if (e.code === 'KeyT') {
        this.tapTempo.handleTap();
      }
    });
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new GapMetronomeApp());
} else {
  new GapMetronomeApp();
}
