/**
 * ThemeManager
 * Manages application themes with localStorage persistence
 */
export class ThemeManager {
  constructor() {
    this.themes = {
      light: {
        name: 'Light',
        colors: {
          '--bg-gradient-start': '#f8fafc',
          '--bg-gradient-end': '#e2e8f0',
          '--bg-primary': '#ffffff',
          '--bg-elevated': '#f8fafc',
          '--bg-overlay': '#f1f5f9',
          '--bg-card': '#ffffff',
          '--bg-dark': '#0f172a',
          '--text-primary': '#0f172a',
          '--text-secondary': '#334155',
          '--text-muted': '#64748b',
          '--border': '#cbd5e1',
          '--accent': '#3b82f6',
          '--accent-hover': '#2563eb',
          '--gap-color': '#3b82f6',
          '--accent-glow': 'rgba(59, 130, 246, 0.35)',
          '--gap-glow': 'rgba(59, 130, 246, 0.35)',
          '--note-filter': 'brightness(0)',
          '--error': '#ef4444',
          '--success': '#22c55e'
        }
      },
      dark: {
        name: 'Dark',
        colors: {
          '--bg-gradient-start': '#0f172a',
          '--bg-gradient-end': '#1e293b',
          '--bg-primary': '#0f172a',
          '--bg-elevated': '#1e293b',
          '--bg-overlay': 'rgba(30, 41, 59, 0.8)',
          '--bg-card': '#1e293b',
          '--bg-dark': '#020617',
          '--text-primary': '#f8fafc',
          '--text-secondary': '#cbd5e1',
          '--text-muted': '#94a3b8',
          '--border': '#334155',
          '--accent': '#06b6d4',
          '--accent-hover': '#0891b2',
          '--gap-color': '#06b6d4',
          '--accent-glow': 'rgba(6, 182, 212, 0.5)',
          '--gap-glow': 'rgba(6, 182, 212, 0.4)',
          '--note-filter': 'brightness(0) invert(1)',
          '--error': '#ef4444',
          '--success': '#22c55e'
        }
      }
    };
    this.currentTheme = this.loadTheme();
  }

  /**
   * Load theme from localStorage or default to gradient
   */
  loadTheme() {
    const saved = localStorage.getItem('theme');
    return (saved && this.themes[saved]) ? saved : 'dark';
  }

  /**
   * Save theme to localStorage
   */
  saveTheme(themeName) {
    localStorage.setItem('theme', themeName);
  }

  /**
   * Apply theme to document
   */
  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error(`Theme "${themeName}" not found`);
      return;
    }

    this.currentTheme = themeName;
    this.saveTheme(themeName);

    const theme = this.themes[themeName];
    const root = document.documentElement;

    // Apply all color variables
    Object.entries(theme.colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    document.body.style.background = 'linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)';
    document.body.style.backgroundAttachment = 'fixed';

    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeName } }));
  }

  /**
   * Get current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   */
  getThemes() {
    return Object.entries(this.themes).map(([key, theme]) => ({
      key,
      name: theme.name
    }));
  }

  /**
   * Initialize theme on page load
   */
  init() {
    this.applyTheme(this.currentTheme);
  }
}
