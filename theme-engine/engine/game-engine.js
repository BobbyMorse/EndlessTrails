/**
 * Trail Game Engine - Core Game Logic (Theme-Agnostic)
 *
 * This is the heart of the game engine. It manages:
 * - Game state
 * - Resource tracking
 * - Journey progression
 * - Party member management
 * - Event triggering
 *
 * All theme-specific content is injected via the theme object.
 */

class TrailGameEngine {
  constructor(theme) {
    this.theme = theme;
    this.state = this.initializeGameState();
    this.eventHistory = [];
  }

  /**
   * Initialize game state from theme configuration
   */
  initializeGameState() {
    const { resources, journey, professions } = this.theme;

    return {
      // Resources (fuel, food, morale, currency, specialItem)
      resources: {
        fuel: resources.fuel.startValue,
        food: resources.food.startValue,
        morale: resources.morale.startValue,
        currency: resources.currency.startValue,
        specialItem: resources.specialItem.startValue
      },

      // Journey progress
      distance: 0,
      totalDistance: journey.totalDistance,
      currentLocationIndex: 0,

      // Time tracking
      month: 5, // August 1
      day: 1,

      // Travel settings
      pace: 'steady', // mellow, steady, rush
      rations: 'normal', // bare, normal, feast
      weather: 'clear', // clear, rain, bad, hot

      // Player state
      profession: null,
      professionModifiers: null,
      alive: true,

      // Party members
      party: [],

      // Tracking
      usedEvents: [],
      forageCount: 0,

      // Items/collectibles
      items: {}
    };
  }

  /**
   * Set player profession and apply starting modifiers
   */
  setProfession(professionId) {
    const profession = this.theme.professions.find(p => p.id === professionId);
    if (!profession) throw new Error(`Profession ${professionId} not found`);

    this.state.profession = professionId;
    this.state.professionName = profession.displayName;
    this.state.professionModifiers = profession.modifiers;
    this.state.resources.currency = profession.startingCurrency;

    // Set score multiplier based on difficulty
    const multipliers = {
      dealer: 0.8,
      dropout: 1.0,
      artist: 1.3
    };
    this.state.scoreMultiplier = multipliers[professionId] || 1.0;
  }

  /**
   * Initialize party members
   */
  initializeParty(memberNames) {
    this.state.party = memberNames.map(name => ({
      name,
      doubting: false,
      doubt: null,
      abandoned: false
    }));
  }

  /**
   * Get current journey phase (early/middle/late)
   */
  getCurrentPhase() {
    const { phases } = this.theme.journey;
    for (const phase of phases) {
      if (this.state.distance >= phase.startMile && this.state.distance < phase.endMile) {
        return phase.name;
      }
    }
    return phases[phases.length - 1].name;
  }

  /**
   * Advance time by specified number of days
   */
  advanceTime(days) {
    this.state.day += days;

    // Month progression
    const monthDays = [31, 30, 31, 30, 31, 31, 30]; // Simplified calendar
    while (this.state.day > monthDays[this.state.month]) {
      this.state.day -= monthDays[this.state.month];
      this.state.month++;
      if (this.state.month >= monthDays.length) {
        this.state.month = 0; // Wrap around (shouldn't happen in normal gameplay)
      }
    }
  }

  /**
   * Calculate miles traveled based on pace
   */
  getMilesPerDay() {
    const paceMiles = {
      mellow: 30,
      steady: 50,
      rush: 70
    };
    return paceMiles[this.state.pace] || 50;
  }

  /**
   * Calculate resource consumption rates
   */
  getConsumptionRates() {
    // Gas consumption by pace (matches original exactly)
    const paceGas = {
      mellow: 8,
      steady: 12,
      rush: 18
    };

    // Food consumption by rations (matches original exactly)
    const rationFood = {
      bare: 4,
      normal: 8,
      feast: 15
    };

    // Base morale drain from profession
    const professionMoraleDrain = this.state.professionModifiers?.vibeDrainByPhase?.[this.getCurrentPhase()] || 5;

    // Pace modifiers to morale
    let paceModifier = 0;
    if (this.state.pace === 'rush') paceModifier += 3;
    if (this.state.pace === 'mellow') paceModifier -= 2;

    // Ration modifiers to morale
    let rationModifier = 0;
    if (this.state.rations === 'bare') rationModifier += 2;
    if (this.state.rations === 'feast') rationModifier -= 2;

    // Weather modifiers to morale
    let weatherModifier = 0;
    if (this.state.weather === 'bad') weatherModifier += 8;
    if (this.state.weather === 'rain') weatherModifier += 3;

    // Hot weather affects food
    let weatherFoodModifier = 0;
    if (this.state.weather === 'hot') weatherFoodModifier += 3;

    return {
      fuel: paceGas[this.state.pace] || 12,
      food: (rationFood[this.state.rations] || 8) + weatherFoodModifier,
      moraleBase: professionMoraleDrain + paceModifier + rationModifier + weatherModifier
    };
  }

  /**
   * Travel for one day
   */
  travel() {
    const miles = this.getMilesPerDay();
    const consumption = this.getConsumptionRates();

    // Move forward
    this.state.distance += miles;
    this.advanceTime(1);

    // Consume resources
    this.state.resources.fuel -= consumption.fuel;

    // Only consume food if it's actually food (not Evidence)
    // Evidence accumulates rather than depletes
    if (this.theme.resources.food.name !== 'Evidence') {
      this.state.resources.food -= consumption.food;
    }

    // Herbs consumption and morale system
    // If you have herbs, consume them and vibes stay stable
    // If you're out of herbs, vibes drain significantly
    if (this.state.resources.specialItem > 0) {
      // Consume herbs each day (reduces stress of the journey)
      this.state.resources.specialItem -= 2;
      if (this.state.resources.specialItem < 0) this.state.resources.specialItem = 0;

      // With herbs, minimal vibe drain (just basic pace/ration/weather modifiers)
      const minimalDrain = consumption.moraleBase - this.getProfessionBaseDrain();
      this.state.resources.morale -= Math.max(0, minimalDrain);
    } else {
      // No herbs! Full vibe drain kicks in - journey gets rough
      this.state.resources.morale -= consumption.moraleBase;
    }

    // Update weather randomly
    this.updateWeather();

    // Apply party morale effects
    const abandonedMembers = this.updatePartyMorale();

    // Store abandonment for UI to handle
    this.state.abandonedThisTurn = abandonedMembers;

    // Check for location arrival
    return this.checkLocationArrival();
  }

  /**
   * Get base profession morale drain (without modifiers)
   */
  getProfessionBaseDrain() {
    const profession = this.state.profession;
    if (!profession) return 0;

    const phase = this.getCurrentPhase();
    const vibeDrainByPhase = profession.vibeDrainByPhase || {};
    return vibeDrainByPhase[phase] || 0;
  }

  /**
   * Update weather conditions randomly
   */
  updateWeather() {
    const random = Math.random();
    if (random < 0.7) {
      this.state.weather = 'clear';
    } else if (random < 0.85) {
      this.state.weather = 'rain';
    } else if (random < 0.95) {
      this.state.weather = 'hot';
    } else {
      this.state.weather = 'bad';
    }
  }

  /**
   * Update party member morale states
   * Returns array of members who abandoned this turn
   */
  updatePartyMorale() {
    const vibes = this.state.resources.morale;
    const abandonedThisTurn = [];

    // Count how many should be doubting based on vibes
    let targetDoubters = 0;
    if (vibes < 75) targetDoubters = 1;
    if (vibes < 50) targetDoubters = 2;
    if (vibes < 30) targetDoubters = 3;

    const currentDoubters = this.state.party.filter(m => !m.abandoned && m.doubting).length;
    const nonAbandonedParty = this.state.party.filter(m => !m.abandoned);

    // Add doubters if needed
    if (currentDoubters < targetDoubters) {
      const nonDoubting = nonAbandonedParty.filter(m => !m.doubting);
      const toDoubt = targetDoubters - currentDoubters;

      for (let i = 0; i < toDoubt && i < nonDoubting.length; i++) {
        const member = nonDoubting[i];
        member.doubting = true;

        // Pick appropriate doubt type based on what's actually wrong
        const paranoia = this.state.resources.specialItem;
        const belief = this.state.resources.morale;

        let availableDoubts = this.theme.events.doubts;

        // Determine which resource is the problem
        const highParanoia = paranoia >= 50;
        const lowBelief = belief < 50;

        if (highParanoia && !lowBelief) {
          // ONLY high paranoia is the problem
          availableDoubts = this.theme.events.doubts.filter(d => d.trigger === 'highParanoia');
        } else if (lowBelief && !highParanoia) {
          // ONLY low belief is the problem
          availableDoubts = this.theme.events.doubts.filter(d => d.trigger === 'lowBelief');
        } else if (highParanoia && lowBelief) {
          // BOTH are problems - pick randomly between the two types
          const useParanoiaDoubt = Math.random() < 0.5;
          availableDoubts = this.theme.events.doubts.filter(d =>
            d.trigger === (useParanoiaDoubt ? 'highParanoia' : 'lowBelief')
          );
        } else {
          // Neither is a problem (high belief, low paranoia) - shouldn't happen, but use low belief doubts as default
          availableDoubts = this.theme.events.doubts.filter(d => d.trigger === 'lowBelief');
        }

        // Fallback to all doubts if filtering resulted in empty array
        if (availableDoubts.length === 0) {
          availableDoubts = this.theme.events.doubts;
        }

        const randomDoubt = availableDoubts[Math.floor(Math.random() * availableDoubts.length)];
        member.doubt = randomDoubt.name;
      }
    }

    // Remove doubters if vibes improve
    if (vibes > 75 && currentDoubters > 0) {
      nonAbandonedParty.forEach(member => {
        if (member.doubting) {
          member.doubting = false;
          member.doubt = null;
        }
      });
    }

    // Drain vibes from doubting members
    this.state.party.forEach(member => {
      if (member.abandoned || !member.doubting) return;

      const doubt = this.theme.events.doubts.find(d => d.name === member.doubt);
      if (doubt) {
        this.state.resources.morale -= doubt.moraleDrain;
      }
    });

    // Check for abandonment (percentage-based, increases as vibes drop)
    this.state.party.forEach(member => {
      if (member.abandoned || !member.doubting) return;

      // Calculate abandonment chance based on vibes
      // 0 vibes = 100% chance (automatic)
      // 30 vibes = ~10% chance
      // 50 vibes = ~5% chance
      // 75+ vibes = 0% chance (only doubters at risk)
      let abandonChance = 0;
      if (vibes <= 0) {
        abandonChance = 1.0; // Automatic at 0 vibes
      } else if (vibes < 30) {
        // 10% to 100% chance between 30 and 0 vibes
        abandonChance = 0.1 + (0.9 * (30 - vibes) / 30);
      } else if (vibes < 50) {
        // 5% to 10% chance between 50 and 30 vibes
        abandonChance = 0.05 + (0.05 * (50 - vibes) / 20);
      } else if (vibes < 75) {
        // 0% to 5% chance between 75 and 50 vibes
        abandonChance = 0.05 * (75 - vibes) / 25;
      }

      // Also check for high paranoia (specialItem)
      // 100 paranoia = 100% chance (complete panic)
      // 70+ paranoia = increasing chance
      const paranoia = this.state.resources.specialItem;
      let paranoiaAbandonChance = 0;
      if (paranoia >= 100) {
        paranoiaAbandonChance = 1.0; // Automatic at max paranoia
      } else if (paranoia >= 85) {
        // 20% to 100% chance between 100 and 85 paranoia
        paranoiaAbandonChance = 0.2 + (0.8 * (paranoia - 85) / 15);
      } else if (paranoia >= 70) {
        // 5% to 20% chance between 85 and 70 paranoia
        paranoiaAbandonChance = 0.05 + (0.15 * (paranoia - 70) / 15);
      }

      // Use the higher of the two chances
      abandonChance = Math.max(abandonChance, paranoiaAbandonChance);

      if (Math.random() < abandonChance) {
        const doubt = this.theme.events.doubts.find(d => d.name === member.doubt);
        member.abandoned = true;

        // Use paranoia-specific reason if abandoning due to paranoia
        if (paranoiaAbandonChance > abandonChance && paranoiaAbandonChance > 0.1) {
          member.abandonReason = 'became too paranoid and fled';
        } else {
          member.abandonReason = doubt?.abandonReason || 'gave up on the trip';
        }

        abandonedThisTurn.push({
          name: member.name,
          reason: member.abandonReason
        });
      }
    });

    return abandonedThisTurn;
  }

  /**
   * Check if player has reached a location
   */
  checkLocationArrival() {
    const nextLoc = this.theme.locations[this.state.currentLocationIndex + 1];
    if (nextLoc && this.state.distance >= nextLoc.distance) {
      this.state.currentLocationIndex++;
      this.state.forageCount = 0; // Reset foraging at new location

      // Apply landmark morale boost
      if (nextLoc.hasLandmark && nextLoc.landmarkData && nextLoc.landmarkData.moraleBoost) {
        this.state.resources.morale = Math.min(
          this.theme.resources.morale.max,
          this.state.resources.morale + nextLoc.landmarkData.moraleBoost
        );
      }

      // Check for win condition
      if (nextLoc.name === this.theme.journey.endLocation) {
        this.state.alive = false; // End game (won)
        return { type: 'win', location: nextLoc };
      }

      return { type: 'arrival', location: nextLoc };
    }

    return null;
  }

  /**
   * Get random event for current phase
   */
  getRandomEvent() {
    const phase = this.getCurrentPhase();
    let eventPool = this.theme.events[phase] || [];

    // If current phase has no events, combine all phases
    if (eventPool.length === 0) {
      eventPool = [
        ...(this.theme.events.early || []),
        ...(this.theme.events.middle || []),
        ...(this.theme.events.late || [])
      ];
    }

    // Filter out used events
    let availableEvents = eventPool.filter(event => {
      const eventKey = event.id || event.text;
      return !this.state.usedEvents.includes(eventKey);
    });

    // If all events used, allow repeats
    if (availableEvents.length === 0) {
      availableEvents = eventPool;
    }

    // Filter by condition if present
    availableEvents = availableEvents.filter(event => {
      if (!event.condition) return true;
      return this.checkEventCondition(event.condition);
    });

    // Apply cop targeting modifier
    const copTargetChance = this.state.professionModifiers?.antagonistTargetChance || 0;
    if (copTargetChance > 0) {
      // Boost weight of cop events based on profession
      availableEvents = availableEvents.map(event => {
        if (event.copEvent) {
          return { ...event, weight: (event.weight || 1) * (1 + copTargetChance) };
        }
        return event;
      });
    }

    if (availableEvents.length === 0) return null;

    // Weighted random selection
    const totalWeight = availableEvents.reduce((sum, e) => sum + (e.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const event of availableEvents) {
      random -= (event.weight || 1);
      if (random <= 0) {
        // Mark as used
        const eventKey = event.id || event.text;
        this.state.usedEvents.push(eventKey);
        this.eventHistory.push({ event, timestamp: { month: this.state.month, day: this.state.day } });
        return event;
      }
    }

    return availableEvents[0];
  }

  /**
   * Check event condition (handles both string and function conditions)
   */
  checkEventCondition(condition) {
    if (typeof condition === 'function') {
      return condition(this.state);
    }

    // Handle string conditions like "hasGuitar", "hasSpareParts"
    if (typeof condition === 'string') {
      const itemCheck = condition.match(/^has(.+)$/);
      if (itemCheck) {
        const itemName = itemCheck[1].charAt(0).toLowerCase() + itemCheck[1].slice(1);
        return !!this.state.items[itemName];
      }
    }

    return true;
  }

  /**
   * Apply event effects to game state
   */
  applyEffects(effects) {
    if (!effects) return;

    Object.keys(effects).forEach(key => {
      const value = effects[key];

      if (key === 'distance') {
        this.state.distance += value;
      } else if (key === 'days') {
        this.advanceTime(value);
      } else if (this.state.resources.hasOwnProperty(key)) {
        this.state.resources[key] += value;

        // Cap resources at max
        const resourceConfig = this.theme.resources[key];
        if (resourceConfig && resourceConfig.max) {
          this.state.resources[key] = Math.min(resourceConfig.max, this.state.resources[key]);
        }
      }
    });

    // Prevent negative resources (except currency can go negative)
    Object.keys(this.state.resources).forEach(key => {
      if (key !== 'currency') {
        this.state.resources[key] = Math.max(0, this.state.resources[key]);
      }
    });
  }

  /**
   * Check fail conditions
   */
  checkFailConditions() {
    const allAbandoned = this.state.party.every(m => m.abandoned);

    if (allAbandoned) {
      this.state.alive = false;
      return { type: 'fail', reason: 'allAbandoned' };
    }

    if (this.state.resources.fuel <= 0) {
      this.state.alive = false;
      return { type: 'fail', reason: 'noFuel' };
    }

    if (this.state.resources.food <= -20) {
      this.state.alive = false;
      return { type: 'fail', reason: 'starved' };
    }

    // Check time limit for mystery themes
    if (this.theme.mystery && this.theme.mystery.enabled) {
      if (this.state.day > this.theme.mystery.timeLimit) {
        this.state.alive = false;
        return { type: 'fail', reason: 'timeExpired' };
      }
    }

    if (this.state.resources.morale <= 0) {
      // Trigger abandonment instead of game over
      const stillHere = this.state.party.filter(m => !m.abandoned);
      if (stillHere.length > 0) {
        const victim = stillHere[Math.floor(Math.random() * stillHere.length)];
        victim.abandoned = true;
        this.state.resources.morale = 20; // Reset morale
        return { type: 'moraleAbandonment', member: victim };
      }
    }

    // Check for max paranoia (Roswell Trail theme)
    if (this.theme.resources.specialItem.name === 'Paranoia' &&
        this.state.resources.specialItem >= 100) {
      const stillHere = this.state.party.filter(m => !m.abandoned);
      if (stillHere.length > 0) {
        const victim = stillHere[Math.floor(Math.random() * stillHere.length)];
        victim.abandoned = true;

        // Choose a paranoia-related reason
        const paranoiaReasons = [
          "fled into the desert muttering about surveillance",
          "destroyed their phone and hitchhiked to Canada",
          "joined a commune to 'go off the grid'",
          "locked themselves in a motel room covered in tinfoil",
          "bought a one-way ticket to remote Alaska",
          "disappeared without a trace (probably witness protection)"
        ];
        victim.reason = paranoiaReasons[Math.floor(Math.random() * paranoiaReasons.length)];

        this.state.resources.specialItem = 80; // Reset paranoia slightly
        return { type: 'paranoiaAbandonment', member: victim };
      }
    }

    return null;
  }

  /**
   * Get current location
   */
  getCurrentLocation() {
    return this.theme.locations[this.state.currentLocationIndex];
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    return (this.state.distance / this.state.totalDistance) * 100;
  }

  /**
   * Forage for food with progressive penalties
   */
  forage() {
    const forageBonus = this.state.professionModifiers?.forageBonus || 0;
    const forageMoraleChange = this.state.professionModifiers?.forageMoraleChange || 0;

    // Base food amount (10-25 with random variation)
    let foodFound = Math.floor(Math.random() * 15) + 10;

    // Apply profession bonus
    foodFound = Math.floor(foodFound * (1 + forageBonus));

    // Progressive penalties for over-foraging at same location
    let moralePenalty = 0;
    let message = '';

    if (this.state.forageCount === 0) {
      message = `You forage and find ${foodFound} food! ${forageMoraleChange >= 0 ? 'Nice!' : ''}`;
    } else if (this.state.forageCount === 1) {
      moralePenalty = -5;
      message = `You forage again and find ${foodFound} food, but the crew's getting restless. (-5 vibes)`;
    } else {
      moralePenalty = -10;
      message = `The locals are giving you dirty looks. You're overstaying your welcome. Found ${foodFound} food. (-10 vibes)`;
    }

    // Apply effects
    this.state.resources.food = Math.min(
      this.theme.resources.food.max,
      this.state.resources.food + foodFound
    );
    this.state.resources.morale += forageMoraleChange + moralePenalty;
    this.state.forageCount++;

    return {
      foodFound,
      moralePenalty,
      forageMoraleChange,
      message
    };
  }

  /**
   * Buy item from shop
   */
  buyItem(itemId) {
    const item = this.theme.shop.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    if (this.state.resources.currency < item.cost) {
      return { success: false, message: 'Not enough cash!' };
    }

    // Deduct cost
    this.state.resources.currency -= item.cost;

    // Apply item effects
    if (item.type === 'fuel' || item.type === 'food' || item.type === 'specialItem' || item.type === 'morale') {
      const resourceKey = item.type === 'fuel' ? 'fuel' :
                          item.type === 'food' ? 'food' :
                          item.type === 'morale' ? 'morale' : 'specialItem';
      const max = this.theme.resources[resourceKey].max;
      const newValue = this.state.resources[resourceKey] + item.amount;

      // Clamp between 0 and max
      this.state.resources[resourceKey] = Math.max(0, Math.min(max, newValue));
    } else if (item.type === 'parts') {
      this.state.items.parts = (this.state.items.parts || 0) + item.amount;
    } else if (item.type === 'guitar') {
      this.state.items.guitar = true;
      this.state.resources.morale = Math.min(this.theme.resources.morale.max, 100);
    }

    return {
      success: true,
      message: `Bought ${item.name} for $${item.cost}!`
    };
  }

  /**
   * Rest for multiple days
   */
  rest(days = 2) {
    const foodCost = 10;

    if (this.state.resources.food < foodCost) {
      return {
        success: false,
        message: "Not enough food to rest safely."
      };
    }

    // Consume food
    this.state.resources.food -= foodCost;

    // Advance time
    this.advanceTime(days);

    // Cure doubts if vibes > 60
    if (this.state.resources.morale > 60) {
      this.state.party.forEach(member => {
        member.doubting = false;
        member.doubt = null;
      });
    }

    return {
      success: true,
      message: `You rest for ${days} days. ${this.state.resources.morale > 60 ? 'Everyone feels refreshed and doubts fade away!' : 'The rest helps a bit.'}`
    };
  }

  /**
   * Save game state
   */
  saveGame() {
    return {
      themeName: this.theme.name,
      themeVersion: this.theme.version,
      state: JSON.parse(JSON.stringify(this.state)),
      eventHistory: this.eventHistory,
      timestamp: Date.now()
    };
  }

  /**
   * Load game state
   */
  loadGame(saveData) {
    if (saveData.themeName !== this.theme.name) {
      throw new Error('Save file is for a different theme');
    }

    this.state = saveData.state;
    this.eventHistory = saveData.eventHistory || [];
  }
}

// Export for use in browser or Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrailGameEngine;
}
