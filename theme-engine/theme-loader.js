/**
 * Theme Loader & Marketplace System
 *
 * Handles:
 * - Loading themes from JSON files
 * - Theme validation
 * - Theme marketplace/selection
 * - Dynamic theme switching
 */

class ThemeLoader {
  constructor() {
    this.themes = new Map();
    this.currentTheme = null;
  }

  /**
   * Load a theme from JSON
   */
  async loadTheme(themePath) {
    try {
      const response = await fetch(themePath);
      if (!response.ok) {
        throw new Error(`Failed to load theme: ${response.statusText}`);
      }

      const themeData = await response.json();
      this.validateTheme(themeData);
      this.themes.set(themeData.name, themeData);

      return themeData;
    } catch (error) {
      console.error('Theme loading error:', error);
      throw error;
    }
  }

  /**
   * Load multiple themes at once
   */
  async loadThemes(themePaths) {
    const promises = themePaths.map(path => this.loadTheme(path));
    return Promise.all(promises);
  }

  /**
   * Load themes embedded in the HTML as JSON script tags.
   */
  loadEmbeddedThemes() {
    const scripts = document.querySelectorAll('script[type="application/json"][data-embedded-theme]');
    let count = 0;

    scripts.forEach(script => {
      const raw = script.textContent.trim();
      if (!raw) return;

      const themeData = JSON.parse(raw);
      this.validateTheme(themeData);
      this.themes.set(themeData.name, themeData);
      count += 1;
    });

    return count;
  }

  /**
   * Validate theme structure
   */
  validateTheme(theme) {
    const required = ['name', 'version', 'metadata', 'resources', 'professions', 'journey', 'locations', 'events'];

    required.forEach(field => {
      if (!theme[field]) {
        throw new Error(`Theme missing required field: ${field}`);
      }
    });

    // Validate resources
    const requiredResources = ['fuel', 'food', 'morale', 'currency', 'specialItem'];
    requiredResources.forEach(res => {
      if (!theme.resources[res]) {
        throw new Error(`Theme missing required resource: ${res}`);
      }
    });

    // Validate professions
    if (!Array.isArray(theme.professions) || theme.professions.length === 0) {
      throw new Error('Theme must have at least one profession');
    }

    // Validate locations
    if (!Array.isArray(theme.locations) || theme.locations.length < 2) {
      throw new Error('Theme must have at least 2 locations');
    }

    // Validate events
    if (!theme.events.early || !theme.events.middle || !theme.events.late) {
      throw new Error('Theme must have events for early, middle, and late phases');
    }

    return true;
  }

  /**
   * Get all loaded themes
   */
  getThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme by name
   */
  getTheme(name) {
    return this.themes.get(name);
  }

  /**
   * Set current active theme
   */
  setCurrentTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw new Error(`Theme not found: ${themeName}`);
    }

    this.currentTheme = theme;
    return theme;
  }

  /**
   * Render theme marketplace UI
   */
  renderMarketplace(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }

    container.innerHTML = '<h2>Select a Theme</h2>';

    const themeGrid = document.createElement('div');
    themeGrid.className = 'theme-grid';

    this.getThemes().forEach(theme => {
      const card = this.createThemeCard(theme);
      themeGrid.appendChild(card);
    });

    container.appendChild(themeGrid);
  }

  /**
   * Create theme card UI element
   */
  createThemeCard(theme) {
    const card = document.createElement('div');
    card.className = 'theme-card';

    card.innerHTML = `
      <div class="theme-card-header">
        <h3>${theme.name}</h3>
        <span class="theme-version">v${theme.version}</span>
      </div>
      <div class="theme-card-body">
        <p class="theme-description">${theme.metadata.description}</p>
        <div class="theme-meta">
          <span class="theme-era">${theme.metadata.era}</span>
          <span class="theme-difficulty">${theme.metadata.difficulty}</span>
        </div>
        <div class="theme-tags">
          ${theme.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="theme-author">by ${theme.metadata.author}</div>
      </div>
      <div class="theme-card-footer">
        <button class="play-theme-btn" data-theme="${theme.name}">
          Play This Theme
        </button>
      </div>
    `;

    // Add click handler
    const btn = card.querySelector('.play-theme-btn');
    btn.addEventListener('click', () => {
      this.onThemeSelected(theme.name);
    });

    return card;
  }

  /**
   * Handle theme selection
   */
  onThemeSelected(themeName) {
    this.setCurrentTheme(themeName);

    // Dispatch custom event
    const event = new CustomEvent('themeSelected', {
      detail: { theme: this.currentTheme }
    });
    document.dispatchEvent(event);
  }

  /**
   * Export theme to JSON file (for theme creators)
   */
  exportTheme(theme) {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${theme.name.toLowerCase().replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  /**
   * Import theme from uploaded file
   */
  async importTheme(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const themeData = JSON.parse(e.target.result);
          this.validateTheme(themeData);
          this.themes.set(themeData.name, themeData);
          resolve(themeData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get theme statistics
   */
  getThemeStats(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) return null;

    return {
      name: theme.name,
      version: theme.version,
      totalLocations: theme.locations.length,
      totalEvents: {
        early: theme.events.early.length,
        middle: theme.events.middle.length,
        late: theme.events.late.length,
        total: theme.events.early.length + theme.events.middle.length + theme.events.late.length
      },
      professions: theme.professions.length,
      distance: theme.journey.totalDistance,
      hasMiniGames: !!theme.miniGames
    };
  }
}

// Global theme loader instance
const themeLoader = new ThemeLoader();

// Auto-load bundled themes on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load embedded themes
    themeLoader.loadEmbeddedThemes();

    // Always load external theme files from themes folder
    // This allows users to add custom themes without editing HTML
    try {
      await themeLoader.loadThemes([
        'themes/norcal-trail.json',
        'themes/roswell-trail.json'
        // Add more bundled themes here
      ]);
    } catch (error) {
      console.warn('Could not load external themes:', error.message);
    }

    console.log('Themes loaded:', themeLoader.getThemes().map(t => t.name));
  } catch (error) {
    console.error('Failed to load themes:', error);
  }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeLoader;
}
