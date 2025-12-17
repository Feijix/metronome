import { StateManager } from './core/StateManager.js';
import { MetronomeAudio } from './core/MetronomeAudio.js';
import { MetronomeScheduler } from './core/MetronomeScheduler.js';
import { TapTempo } from './features/TapTempo.js';
import { BPMDisplay } from './ui/BPMDisplay.js';
import { BeatsVisualizer } from './ui/BeatsVisualizer.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { AccentControls } from './ui/AccentControls.js';
import { PlayButton } from './ui/PlayButton.js';
import { PWAInstaller } from './utils/PWAInstaller.js';
import { DOMHelpers } from './utils/DOMHelpers.js';
import { PresetManager } from './features/PresetManager.js';

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
    this.presetManager = new PresetManager(this.state);
  }

  initializeUI() {
    const elements = DOMHelpers.getAllElements();

    // UI Components
    this.bpmDisplay = new BPMDisplay(this.state, elements);
    this.visualizer = new BeatsVisualizer(
      this.state,
      elements.beatsContainer,
      elements.barDisplay,
      elements.barTotal,
      elements.modeDisplay
    );
    this.controlPanel = new ControlPanel(this.state, elements);
    this.accentControls = new AccentControls(this.state, elements);
    this.playButton = new PlayButton(this.scheduler, elements.playBtn);

    // Tap tempo button
    elements.tapTempo.addEventListener('click', () => this.tapTempo.handleTap());

    // Prevent double-click zoom
    DOMHelpers.preventDoubleClickZoom();

    // Initialize displays
    this.visualizer.init();

    // Preset controls
    const presetNameInput = document.getElementById('preset-name');
    const savePresetBtn = document.getElementById('save-preset');
    const loadPresetSelect = document.getElementById('load-preset');
    const loadPresetBtn = document.getElementById('load-preset-btn');

    this.presetManager.getPresetNames().forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      loadPresetSelect.appendChild(option);
    });

    savePresetBtn.addEventListener('click', () => {
      const name = presetNameInput.value.trim();
      if (name) {
        this.presetManager.savePreset(name);
        alert(`Preset "${name}" saved!`);
        presetNameInput.value = '';
        loadPresetSelect.innerHTML = '';
        this.presetManager.getPresetNames().forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          loadPresetSelect.appendChild(option);
        });
      } else {
        alert('Please enter a preset name.');
      }
    });

    loadPresetBtn.addEventListener('click', () => {
      const selectedName = loadPresetSelect.value.trim();
      if (selectedName) {
        this.presetManager.loadPreset(selectedName);
        alert(`Preset "${selectedName}" loaded!`);
      } else {
        alert('Please select a preset to load.');
      }
    });
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
