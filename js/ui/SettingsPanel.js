import { SOUND_TYPES } from '../config/constants.js';
import { WakeLockManager } from '../utils/WakeLockManager.js';
import { ThemeManager } from '../utils/ThemeManager.js';

/**
 * SettingsPanel
 * Manages the slide-up settings panel with all configuration options
 */
export class SettingsPanel {
  constructor(stateManager, audioEngine, presetManager, elements) {
    this.state = stateManager;
    this.audio = audioEngine;
    this.presetManager = presetManager;
    this.elements = elements;
    this.wakeLock = new WakeLockManager();
    this.themeManager = new ThemeManager();

    // Initialize theme first
    this.themeManager.init();

    this.bindEvents();
    this.subscribeToState();
    this.updatePresetList();
    this.updateThemeUI();
    this.syncInitialUI();
  }

  // Reflect the persisted config into the settings UI on load (sound choice,
  // toggles) so reopening the app shows the saved selections.
  syncInitialUI() {
    this.updateSoundSelection(this.state.getSoundType());
    this.updateVibrate(this.state.getVibrate());
    this.updateAccentOne(this.state.getAccentOne());
    this.updateAccentQuarters(this.state.getAccentQuarters());
    this.updateFlashToggle(this.state.getFlashOnChange());
    this.updateWakeLockToggle(this.state.getKeepAwake());
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Open/close settings
    if (this.elements.settingsIcon) {
      this.elements.settingsIcon.addEventListener('click', () => this.open());
    }
    if (this.elements.settingsClose) {
      this.elements.settingsClose.addEventListener('click', () => this.close());
    }
    if (this.elements.settingsBackdrop) {
      this.elements.settingsBackdrop.addEventListener('click', () => this.close());
    }

    // Theme selection
    const themeOptions = document.querySelectorAll('.theme-option');
    if (themeOptions) {
      themeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          const theme = btn.dataset.theme;
          this.themeManager.applyTheme(theme);
          this.updateThemeUI();
        });
      });
    }

    // Sound selection
    if (this.elements.soundOptions) {
      this.elements.soundOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          const soundType = btn.dataset.sound;
          this.state.setSoundType(soundType);
          this.audio.setSoundType(soundType);
        });
      });
    }

    // Accent toggles
    if (this.elements.settingsAccentOne) {
      this.elements.settingsAccentOne.addEventListener('click', () => {
        this.state.toggleAccentOne();
      });
    }
    if (this.elements.settingsAccentQuarters) {
      this.elements.settingsAccentQuarters.addEventListener('click', () => {
        this.state.toggleAccentQuarters();
      });
    }

    // Flash on pattern change toggle
    if (this.elements.settingsFlash) {
      this.elements.settingsFlash.addEventListener('click', () => {
        const newValue = !this.state.getFlashOnChange();
        this.state.setFlashOnChange(newValue);
      });
    }

    // Vibrate toggle
    if (this.elements.settingsVibrate) {
      this.elements.settingsVibrate.addEventListener('click', () => {
        this.state.setVibrate(!this.state.getVibrate());
      });
    }

    // Wake lock toggle
    if (this.elements.settingsWakeLock) {
      this.elements.settingsWakeLock.addEventListener('click', async () => {
        const newValue = !this.state.getKeepAwake();
        this.state.setKeepAwake(newValue);

        if (newValue) {
          const success = await this.wakeLock.request();
          if (!success) {
            // If wake lock failed, revert state
            this.state.setKeepAwake(false);
            alert('Wake lock not supported or permission denied');
          }
        } else {
          await this.wakeLock.release();
        }
      });
    }

    // Preset management
    if (this.elements.savePreset) {
      this.elements.savePreset.addEventListener('click', () => {
        const name = this.elements.presetName?.value.trim();
        if (name) {
          this.presetManager.savePreset(name);
          this.updatePresetList();
          if (this.elements.presetName) {
            this.elements.presetName.value = '';
          }
        }
      });
    }

    if (this.elements.presetSelect) {
      this.elements.presetSelect.addEventListener('change', (e) => {
        const name = e.target.value;
        if (name) {
          this.presetManager.loadPreset(name);
          // Update audio engine with loaded sound type
          this.audio.setSoundType(this.state.getSoundType());
          // Update wake lock if needed
          if (this.state.getKeepAwake() && !this.wakeLock.isActive()) {
            this.wakeLock.request();
          } else if (!this.state.getKeepAwake() && this.wakeLock.isActive()) {
            this.wakeLock.release();
          }
        }
      });
    }

    if (this.elements.deletePreset) {
      this.elements.deletePreset.addEventListener('click', () => {
        const name = this.elements.presetSelect?.value;
        if (name && confirm(`Delete preset "${name}"?`)) {
          this.presetManager.deletePreset(name);
          this.updatePresetList();
        }
      });
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribeToState() {
    this.state.subscribe('soundType', (value) => this.updateSoundSelection(value));
    this.state.subscribe('accentOne', (value) => this.updateAccentOne(value));
    this.state.subscribe('accentQuarters', (value) => this.updateAccentQuarters(value));
    this.state.subscribe('flashOnChange', (value) => this.updateFlashToggle(value));
    this.state.subscribe('keepAwake', (value) => this.updateWakeLockToggle(value));
    this.state.subscribe('vibrate', (value) => this.updateVibrate(value));
  }

  updateVibrate(value) {
    if (this.elements.settingsVibrate) {
      this.elements.settingsVibrate.classList.toggle('active', value);
    }
  }

  /**
   * Open settings panel
   */
  open() {
    if (this.elements.settingsPanel) {
      this.elements.settingsPanel.classList.add('active');
    }
    if (this.elements.settingsBackdrop) {
      this.elements.settingsBackdrop.classList.add('active');
    }
  }

  /**
   * Close settings panel
   */
  close() {
    if (this.elements.settingsPanel) {
      this.elements.settingsPanel.classList.remove('active');
    }
    if (this.elements.settingsBackdrop) {
      this.elements.settingsBackdrop.classList.remove('active');
    }
  }

  /**
   * Update sound selection display
   */
  updateSoundSelection(soundType) {
    if (this.elements.soundOptions) {
      this.elements.soundOptions.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sound === soundType);
      });
    }
  }

  /**
   * Update accent one toggle display
   */
  updateAccentOne(value) {
    if (this.elements.settingsAccentOne) {
      this.elements.settingsAccentOne.classList.toggle('active', value);
    }
  }

  /**
   * Update accent quarters toggle display
   */
  updateAccentQuarters(value) {
    if (this.elements.settingsAccentQuarters) {
      this.elements.settingsAccentQuarters.classList.toggle('active', value);
    }
  }

  /**
   * Update flash toggle display
   */
  updateFlashToggle(value) {
    if (this.elements.settingsFlash) {
      this.elements.settingsFlash.classList.toggle('active', value);
    }
  }

  /**
   * Update wake lock toggle display
   */
  updateWakeLockToggle(value) {
    if (this.elements.settingsWakeLock) {
      this.elements.settingsWakeLock.classList.toggle('active', value);
    }
  }

  /**
   * Update preset select dropdown
   */
  updatePresetList() {
    if (!this.elements.presetSelect) return;

    const names = this.presetManager.getPresetNames();
    this.elements.presetSelect.innerHTML = '<option value="">Load preset...</option>';

    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      this.elements.presetSelect.appendChild(option);
    });
  }

  /**
   * Update theme selection display
   */
  updateThemeUI() {
    const currentTheme = this.themeManager.getCurrentTheme();
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
  }
}
