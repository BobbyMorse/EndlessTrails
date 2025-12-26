# Mini-Game System Guide

## Overview

Each theme can define custom mini-games that appear at specific locations along the journey. These replace generic challenges with theme-appropriate arcade-style games.

## Supported Game Types

### 1. **Foraging** (Click Collection)
Players click items before time runs out. Good items = points, bad items = penalties.

**Example: NorCal Trail**
```json
{
  "foraging": {
    "type": "foraging",
    "name": "🌿 FORAGING TIME 🌿",
    "description": "Click on the food items before time runs out!",
    "duration": 30,
    "items": [
      { "icon": "🍎", "type": "good", "value": 3 },
      { "icon": "🥕", "type": "good", "value": 2 },
      { "icon": "🌽", "type": "good", "value": 3 },
      { "icon": "🗑️", "type": "instant_fail", "value": 0 }
    ],
    "regionalItems": {
      "early": [
        { "icon": "🍓", "type": "good", "value": 4 },
        { "icon": "🍇", "type": "good", "value": 3 }
      ],
      "middle": [
        { "icon": "🌽", "type": "good", "value": 5 }
      ],
      "late": [
        { "icon": "🍊", "type": "good", "value": 4 },
        { "icon": "🥑", "type": "good", "value": 5 }
      ]
    },
    "failMessage": "🗑️ TRASH BIN! Food poisoning!"
  }
}
```

**Example: Zombie Theme**
```json
{
  "scavenging": {
    "type": "foraging",
    "name": "🏚️ SCAVENGE SUPPLIES 🏚️",
    "description": "Search the abandoned building! Avoid zombie traps!",
    "duration": 25,
    "items": [
      { "icon": "🥫", "type": "good", "value": 5 },
      { "icon": "💊", "type": "good", "value": 4 },
      { "icon": "🔫", "type": "good", "value": 10 },
      { "icon": "🧟", "type": "instant_fail", "value": 0 },
      { "icon": "💣", "type": "bad", "value": -5 }
    ],
    "failMessage": "🧟 ZOMBIE! You've been bitten!"
  }
}
```

**Item Types:**
- `good` - Awards points/resources
- `bad` - Deducts points but doesn't end game
- `instant_fail` - Immediately ends game with penalty

---

### 2. **Avoidance** (Dodge Obstacles)
Players dodge falling/moving obstacles while collecting power-ups. Like Cosmic River Rapids.

**Example: NorCal Trail**
```json
{
  "riverRapids": {
    "type": "avoidance",
    "name": "🌊 COSMIC RIVER TUBING 🌊",
    "description": "Dodge bummers & catch groovy vibes!",
    "duration": 30,
    "maxHits": 3,
    "spawnRate": 800,
    "playerIcon": "🛟",
    "goodItems": [
      { "icon": "🌈", "type": "good", "value": 5 },
      { "icon": "🌿", "type": "good", "value": 3 },
      { "icon": "✨", "type": "good", "value": 5 }
    ],
    "badItems": [
      { "icon": "💩", "type": "bad", "value": 0 },
      { "icon": "🗑️", "type": "bad", "value": 0 },
      { "icon": "🪨", "type": "bad", "value": 0 }
    ],
    "controlsHint": "Use ← → arrows or tap left/right sides to move!",
    "bonusMultiplier": 1,
    "successMessage": "Far out! You navigated the psychedelic river!",
    "failMessage": "Too many bummers! Bad trip!",
    "failPenalty": { "morale": -20 }
  }
}
```

**Example: Space Theme**
```json
{
  "asteroidField": {
    "type": "avoidance",
    "name": "☄️ ASTEROID FIELD ☄️",
    "description": "Navigate through the debris field!",
    "duration": 30,
    "maxHits": 3,
    "spawnRate": 700,
    "playerIcon": "🚀",
    "goodItems": [
      { "icon": "⭐", "type": "good", "value": 5 },
      { "icon": "💎", "type": "good", "value": 10 },
      { "icon": "🛰️", "type": "good", "value": 7 }
    ],
    "badItems": [
      { "icon": "☄️", "type": "bad", "value": 0 },
      { "icon": "🌑", "type": "bad", "value": 0 },
      { "icon": "💥", "type": "bad", "value": 0 }
    ],
    "controlsHint": "Steer your ship left/right to dodge asteroids!",
    "bonusMultiplier": 2,
    "successMessage": "Field navigated! Shields holding!",
    "failMessage": "Hull breach! Critical damage!",
    "failPenalty": { "fuel": -30, "morale": -15 }
  }
}
```

**Configuration:**
- `duration` - Time limit in seconds
- `maxHits` - How many bad items before game over
- `spawnRate` - Milliseconds between obstacle spawns
- `playerIcon` - Emoji for the player
- `bonusMultiplier` - Score → morale conversion rate

---

### 3. **Repair** (Memory Match)
Players match pairs of parts before time runs out.

**Example: NorCal Trail**
```json
{
  "busRepair": {
    "type": "repair",
    "name": "🔧 BUS REPAIR 🔧",
    "description": "Match the parts to fix your VW Bus!",
    "duration": 20,
    "partsNeeded": 5,
    "parts": ["🔧", "🔩", "⚙️", "🔨", "⛽", "🔋", "🛞"],
    "successMessage": "Bus fixed! Back on the road!",
    "failMessage": "Couldn't fix it in time. Need a mechanic.",
    "failPenalty": { "currency": -80, "morale": -10 }
  }
}
```

**Example: Spaceship Theme**
```json
{
  "shipRepair": {
    "type": "repair",
    "name": "⚙️ EMERGENCY REPAIRS ⚙️",
    "description": "Match components to repair the reactor!",
    "duration": 25,
    "partsNeeded": 6,
    "parts": ["🔌", "🔋", "⚡", "🛰️", "🔧", "⚙️", "💾", "🔬"],
    "successMessage": "Reactor online! Power restored!",
    "failMessage": "Systems failing! Emergency shutdown!",
    "failPenalty": { "fuel": -50, "morale": -20 }
  }
}
```

---

### 4. **Rhythm** (Coming Soon)
Timing-based button presses to a beat. Future expansion.

---

## Assigning Games to Locations

In your theme's `locations` array, specify which mini-game to trigger:

```json
{
  "locations": [
    {
      "name": "Cosmic River Rapids",
      "distance": 2750,
      "isShop": false,
      "isTown": false,
      "miniGame": "riverRapids"  // ← References miniGames.riverRapids
    },
    {
      "name": "Broken Down Bus",
      "distance": 1200,
      "isShop": false,
      "isTown": false,
      "miniGame": "busRepair"    // ← References miniGames.busRepair
    }
  ]
}
```

When the player arrives at that location, the game engine automatically triggers the mini-game.

---

## Game Results

All mini-games return a result object:

```javascript
{
  success: true,           // Did player win?
  score: 45,               // Points scored
  bonus: {                 // Resources to add
    morale: 20,
    food: 15
  },
  penalty: {               // Resources to subtract (on failure)
    morale: -10,
    currency: -50
  },
  message: "Success!"      // Message to display
}
```

The game engine automatically applies these effects.

---

## Creating a Custom Final Challenge

**Example: Space Theme Final Boss**

```json
{
  "miniGames": {
    "finalBattle": {
      "type": "avoidance",
      "name": "👾 ALIEN MOTHERSHIP BATTLE 👾",
      "description": "Destroy the mothership's weak points!",
      "duration": 60,
      "maxHits": 5,
      "spawnRate": 600,
      "playerIcon": "🚀",
      "goodItems": [
        { "icon": "💥", "type": "good", "value": 10 },  // Hit weak point
        { "icon": "⭐", "type": "good", "value": 5 }     // Power-up
      ],
      "badItems": [
        { "icon": "👾", "type": "bad", "value": 0 },    // Enemy fire
        { "icon": "💣", "type": "bad", "value": 0 }      // Mines
      ],
      "bonusMultiplier": 3,
      "successMessage": "MOTHERSHIP DESTROYED! Earth is saved!",
      "failMessage": "Ship destroyed! Mission failed!",
      "failPenalty": { "morale": -50 }
    }
  },
  "locations": [
    {
      "name": "Alien Mothership",
      "distance": 2950,
      "miniGame": "finalBattle"  // Final challenge before winning
    }
  ]
}
```

---

## Best Practices

1. **Match Theme** - Use thematically appropriate icons and language
2. **Balance Difficulty** - Early games easier, late games harder
3. **Clear Instructions** - Use `description` and `controlsHint` effectively
4. **Fair Penalties** - Instant-fail items should be visually distinct
5. **Mobile-Friendly** - Test on touch devices
6. **Progression** - Final challenge should be hardest/longest

---

## Testing Your Mini-Games

1. Create your mini-game config in the theme JSON
2. Add a test location early in the journey
3. Play test to tune difficulty
4. Adjust `duration`, `spawnRate`, `maxHits` as needed

---

## Future Expansion Ideas

- **Boss Battles** - Multi-phase avoidance games
- **Rhythm Games** - Music-based timing challenges
- **Puzzle Games** - Logic/pattern solving
- **Trading Games** - Negotiation/bartering mini-games
- **Stealth Games** - Avoid detection challenges

The mini-game system is **fully extensible** - new game types can be added to `mini-games.js` without breaking existing themes!
