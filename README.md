# Endless Trails

A theme-based Oregon Trail-style game engine supporting multiple storylines and adventures.

## 🎮 Play the Themes

### Roswell Trail 🛸
Journey from Roswell, New Mexico to Area 51, Nevada in this paranoia-fueled UFO conspiracy adventure. Manage your resources (Gas, Evidence, Belief, Cash, and Paranoia) while avoiding government surveillance and uncovering the truth.

### NorCal Trail 🌲
*(Original Oregon Trail-style adventure)*

## ✨ Features

### Core Engine
- **Theme System**: Easily create new adventures by modifying JSON configuration
- **Resource Management**: Customizable resources per theme
- **Dynamic Events**: JSON-based event system with choices and consequences
- **Mini-Games System**:
  - Foraging for resources
  - Missile Command-style defense
  - Memory match challenges
  - Avoidance games
- **Party Management**: Recruit companions with morale tracking
- **Work System**: Earn money through theme-appropriate jobs
- **Multiple Endings**: Win/lose conditions based on resources and choices

### Roswell Trail Specific
- **3 Character Classes**: Researcher (easy), Truth Blogger (normal), Skeptic Turned Believer (hard)
- **50+ Story Events**: Unique events across early, middle, and late game phases
- **Doubt System**: Random events that challenge your conviction
- **Paranoia Mechanic**: High paranoia attracts more government attention
- **Evidence Collection**: Gather proof through events and mini-games

## 🚀 Play Now

[Play Endless Trails](https://your-deployment-url.vercel.app)

## 🛠️ Tech Stack

- Pure JavaScript (no frameworks required)
- Theme-based JSON configuration system
- HTML5 Canvas for mini-games
- Modular event system with risk/reward mechanics
- Supabase integration for leaderboards (optional)

## 📦 Local Development

1. Clone this repository
2. Open `index.html` in a modern web browser
3. Select your theme and start playing!

No build process required!

## 🎨 Creating Your Own Theme

The engine is designed to be easily themed. Check out:
- `theme-engine/IMPLEMENTATION_GUIDE.md` - Full theme creation guide
- `theme-engine/MINIGAME_GUIDE.md` - How to add mini-games
- `theme-engine/themes/theme-schema.json` - JSON schema reference
- `theme-engine/themes/roswell-trail.json` - Example theme

Create a new JSON file in `theme-engine/themes/` and you're ready to go!

## 📁 Project Structure

```
endless-trails/
├── index.html                          # Main game launcher
├── vercel.json                         # Vercel deployment config
├── theme-engine/
│   ├── engine/
│   │   ├── game-engine.js             # Core game logic
│   │   ├── ui-controller.js           # UI and rendering
│   │   ├── mini-games.js              # Mini-game implementations
│   │   └── high-scores.js             # Leaderboard system
│   ├── themes/
│   │   ├── norcal-trail.json          # Original theme
│   │   ├── roswell-trail.json         # UFO conspiracy theme
│   │   └── theme-schema.json          # Theme configuration schema
│   └── assets/
│       └── styles.css                  # Game styling
```

## 🎯 Game Mechanics

- **Journey System**: Travel through waypoints with distance tracking
- **Resource Management**: Each theme defines its own resources
- **Event System**: Phase-based events (early, middle, late game)
- **Risk/Reward**: Events can have success/failure chances
- **Doubt/Morale**: Character-specific thresholds and drain rates
- **Work Opportunities**: Theme-appropriate ways to earn money

## 📝 Credits

Game engine by Bobby Morse
- Roswell Trail theme
- NorCal Trail theme (original concept)

## 📄 License

MIT License - Feel free to create and share your own themes!

## 🤝 Contributing

Want to add a new theme? Submit a pull request with your theme JSON file!

---

*Choose your trail, manage your resources, reach your destination... if you can.* 🎮
