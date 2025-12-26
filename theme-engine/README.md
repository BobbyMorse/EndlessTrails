# Trail Game Engine - Theme Marketplace Architecture

A fully refactored, theme-agnostic version of The NorCal Trail that supports dynamic theme loading.

## 🚀 Quick Start

1. **Open the game**: Open `index.html` in your web browser (works offline!)
2. **Select a theme**: Choose "The NorCal Trail" from the marketplace
3. **Start your journey**: Pick your profession, name your party, and hit the road!

**✅ READY TO PLAY** - The NorCal Trail theme is fully loaded with all original content!

## Architecture Overview

```
theme-engine/
├── engine/              # Core game engine (theme-agnostic)
│   ├── game-engine.js   # Main game logic
│   ├── resources.js     # Resource management system
│   ├── events.js        # Event system and handlers
│   ├── ui-controller.js # UI rendering engine
│   └── mini-games.js    # Mini-game systems
├── themes/              # Theme data files
│   ├── norcal-trail.json      # Original hippie theme
│   ├── zombie-apocalypse.json # Example alternative theme
│   └── theme-schema.json      # Schema definition
├── assets/              # Shared assets
│   ├── styles.css       # Base styling
│   └── engine-ui.html   # Base HTML template
├── index.html           # Main entry point
└── theme-loader.js      # Dynamic theme loading system
```

## Core Principles

1. **Separation of Concerns**: Game mechanics are completely separate from narrative content
2. **Data-Driven**: All theme-specific content lives in JSON files
3. **Hot-Swappable**: Themes can be changed without code changes
4. **Extensible**: New themes can be created without touching engine code

## Resource System

Resources are abstracted with configurable names, icons, and behaviors:

```javascript
{
  "resources": {
    "morale": { "name": "Vibes", "icon": "✌️", "startValue": 100 },
    "specialItem": { "name": "Herbs", "icon": "🌿", "startValue": 50 },
    "vehicle": { "name": "VW Bus", "icon": "🚐" }
  }
}
```

## Event System

Events use templates with placeholders:

```javascript
{
  "text": "{{partyMember}} wants to buy {{specialItem}}",
  "effects": { "specialItem": -10, "morale": 5 }
}
```

## Theme Marketplace

Themes can be:
- Loaded from local files
- Downloaded from a theme marketplace
- Created with a theme builder tool
- Shared with the community

## Getting Started

1. Open `index.html` in a browser
2. Select a theme from the marketplace
3. Start playing!

## Creating a New Theme

See `themes/theme-schema.json` for the complete specification.

Quick example:

```json
{
  "name": "My Custom Theme",
  "version": "1.0.0",
  "resources": { ... },
  "professions": [ ... ],
  "locations": [ ... ],
  "events": { ... }
}
```

## Status

This is a complete refactor of the original NorCal Trail game with proper architecture for theme support.
