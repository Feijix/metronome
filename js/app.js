import { StateManager } from './core/StateManager.js';
import { MetronomeAudio } from './core/MetronomeAudio.js';
import { MetronomeScheduler } from './core/MetronomeScheduler.js';
import { TapTempo } from './features/TapTempo.js';
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

class GapMetronomeApp {
  constructor() {
    this.initializeCore();
    this.initializeUI();
    this.initializePWA();
    this.setupKeyboardShortcuts();
  }

  initializeCore() {
    // Core instances
    this.state = new StateManager();
    this.audio = new MetronomeAudio();
    this.scheduler = new MetronomeScheduler(this.state, this.audio);
    this.tapTempo = new TapTempo(this.state, this.audio);
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
