/**
 * UI Controller - Theme-Aware Rendering
 *
 * Handles all UI rendering using theme configuration.
 * Completely decoupled from specific theme content.
 */

class UIController {
  constructor(gameEngine, theme) {
    this.engine = gameEngine;
    this.theme = theme;
    this.currentScreen = null;
  }

  /**
   * Initialize the UI with theme styling
   */
  initialize() {
    this.applyThemeColors();
    this.renderTitle();
    this.showStartScreen();
  }

  /**
   * Apply theme color scheme
   */
  applyThemeColors() {
    const colors = this.theme.ui.colorScheme;
    const root = document.documentElement;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-danger', colors.danger);
  }

  /**
   * Render game title
   */
  renderTitle() {
    document.getElementById('gameTitle').textContent = this.theme.ui.title;
    document.getElementById('gameSubtitle').textContent = this.theme.ui.subtitle;
  }

  /**
   * Template replacement helper
   */
  replaceTemplates(text) {
    // Replace {{partyMember}} with random party member
    if (text.includes('{{partyMember}}')) {
      const stillHere = this.engine.state.party.filter(m => !m.abandoned);
      const member = stillHere.length > 0
        ? stillHere[Math.floor(Math.random() * stillHere.length)].name
        : 'Someone';
      text = text.replace(/\{\{partyMember\}\}/g, member);
    }

    // Replace resource names
    Object.keys(this.theme.resources).forEach(key => {
      const resource = this.theme.resources[key];
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), resource.name);
    });

    // Replace vehicle name
    text = text.replace(/\{\{vehicle\}\}/g, this.theme.journey.vehicle.name);

    return text;
  }

  /**
   * Show start screen
   */
  showStartScreen() {
    this.hideAllScreens();
    document.getElementById('startScreen').classList.remove('hidden');
    this.currentScreen = 'start';
  }

  /**
   * Show profession selection
   */
  showProfessionSelection() {
    this.hideAllScreens();
    const screen = document.getElementById('professionScreen');
    screen.classList.remove('hidden');

    const container = document.getElementById('professionButtons');
    container.innerHTML = '';

    this.theme.professions.forEach(prof => {
      const button = document.createElement('button');
      button.className = 'secondary profession-btn';
      button.innerHTML = `
        ${prof.icon} ${prof.displayName} - ${this.theme.resources.currency.prefix}${prof.startingCurrency} start<br>
        <span style="font-size: 0.9rem;">${prof.description}</span>
      `;
      button.onclick = () => this.selectProfession(prof.id);
      container.appendChild(button);
    });

    this.currentScreen = 'profession';
  }

  /**
   * Select profession and start game
   */
  selectProfession(professionId) {
    this.engine.setProfession(professionId);
    this.showNameParty();
  }

  /**
   * Show party naming screen
   */
  showNameParty() {
    this.hideAllScreens();
    document.getElementById('namePartyScreen').classList.remove('hidden');
    const defaults = this.theme.ui.defaultPartyNames || [];
    const inputs = [
      document.getElementById('name1'),
      document.getElementById('name2'),
      document.getElementById('name3'),
      document.getElementById('name4')
    ];

    inputs.forEach((input, index) => {
      if (input && !input.value && defaults[index]) {
        input.value = defaults[index];
      }
    });
    this.currentScreen = 'nameParty';
  }

  /**
   * Start the game with party names
   */
  startGame() {
    const defaults = this.theme.ui.defaultPartyNames || [];
    const names = [
      document.getElementById('name1').value || defaults[0] || 'Traveler 1',
      document.getElementById('name2').value || defaults[1] || 'Traveler 2',
      document.getElementById('name3').value || defaults[2] || 'Traveler 3',
      document.getElementById('name4').value || defaults[3] || 'Traveler 4'
    ];

    this.engine.initializeParty(names);

    // Track game session start for analytics
    if (typeof highScoreManager !== 'undefined') {
      highScoreManager.trackSessionStart(this.theme.name);
    }

    // Show mystery briefing if theme has one
    if (this.theme.mystery && this.theme.mystery.enabled) {
      this.showMysteryBriefing();
    } else {
      this.showGameScreen();
    }
  }

  /**
   * Show mystery briefing
   */
  showMysteryBriefing() {
    this.hideAllScreens();
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');
    document.getElementById('gameScreen').classList.remove('hidden');

    // Update UI labels BEFORE showing the screen
    this.updateUI();

    const mystery = this.theme.mystery;

    eventContainer.innerHTML = `
      <div class="event-box" style="text-align: center; padding: 2rem; border: 3px solid #ff6b6b;">
        <h2 style="color: #ff6b6b; font-size: 2.5rem; margin-bottom: 1.5rem; animation: pulse 2s infinite;">
          ${mystery.title}
        </h2>
        <pre style="font-size: 1.2rem; line-height: 1.8; color: #f0e68c; white-space: pre-wrap; text-align: left; margin: 2rem auto; max-width: 600px;">
${mystery.description}
        </pre>
        <div style="margin: 2rem 0; padding: 1.5rem; background: rgba(255, 107, 107, 0.1); border: 2px solid #ff6b6b;">
          <p style="font-size: 1.4rem; color: #ffd93d; font-weight: bold;">⏰ TIME LIMIT: ${mystery.timeLimit} DAYS ⏰</p>
          <p style="font-size: 1.2rem; color: #4ade80; margin-top: 1rem;">🎯 EVIDENCE NEEDED: ${mystery.evidenceGoal} files</p>
          <p style="font-size: 1rem; color: #8b7355; margin-top: 1rem; font-style: italic;">Bonus: +${mystery.bonusPointsPerDay} points per day remaining</p>
        </div>
      </div>
    `;

    buttonsContainer.innerHTML = '';
    const startBtn = document.createElement('button');
    startBtn.textContent = '🚀 BEGIN MISSION';
    startBtn.style.fontSize = '1.5rem';
    startBtn.style.padding = '1rem 2rem';
    startBtn.onclick = () => {
      this.updateUI();
      this.showMainMenu();
      this.currentScreen = 'game';
    };
    buttonsContainer.appendChild(startBtn);
  }

  /**
   * Show main game screen
   */
  showGameScreen() {
    this.hideAllScreens();
    document.getElementById('gameScreen').classList.remove('hidden');
    this.updateUI();
    this.showMainMenu();
    this.currentScreen = 'game';
  }

  /**
   * Update all UI elements
   */
  updateUI() {
    const { state } = this.engine;
    const { resources } = this.theme;

    // Update resource labels with theme-specific names and icons
    document.getElementById('fuelLabel').textContent = `${resources.fuel.icon} ${resources.fuel.name}`;
    document.getElementById('foodLabel').textContent = `${resources.food.icon} ${resources.food.name}`;
    document.getElementById('moraleLabel').textContent = `${resources.morale.icon} ${resources.morale.name}`;
    document.getElementById('currencyLabel').textContent = `${resources.currency.icon} ${resources.currency.name}`;
    document.getElementById('specialItemLabel').textContent = `${resources.specialItem.icon} ${resources.specialItem.name}`;

    // Update quick stats icons (mobile)
    document.getElementById('fuelIcon').textContent = resources.fuel.icon;
    document.getElementById('foodIcon').textContent = resources.food.icon;
    document.getElementById('moraleIcon').textContent = resources.morale.icon;
    document.getElementById('currencyIcon').textContent = resources.currency.icon;

    // Update resource displays
    document.getElementById('fuelValue').textContent = Math.max(0, Math.floor(state.resources.fuel));
    document.getElementById('foodValue').textContent = Math.max(0, Math.floor(state.resources.food));
    document.getElementById('moraleValue').textContent = Math.max(0, Math.floor(state.resources.morale));
    document.getElementById('currencyValue').textContent =
      resources.currency.prefix + Math.max(0, Math.floor(state.resources.currency));
    document.getElementById('specialItemValue').textContent = Math.max(0, Math.floor(state.resources.specialItem));

    // Update quick stats (mobile)
    document.getElementById('quickFuel').textContent = Math.max(0, Math.floor(state.resources.fuel));
    document.getElementById('quickFood').textContent = Math.max(0, Math.floor(state.resources.food));
    document.getElementById('quickMorale').textContent = Math.max(0, Math.floor(state.resources.morale));
    document.getElementById('quickCurrency').textContent = Math.max(0, Math.floor(state.resources.currency));

    // Color coding
    this.updateResourceColors();

    // Location
    this.updateLocationDisplay();

    // Party status
    this.updatePartyStatus();

    // Date
    const monthNames = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    document.getElementById('dateValue').textContent = `${monthNames[state.month]} ${state.day}`;
  }

  /**
   * Update resource color indicators
   */
  updateResourceColors() {
    ['fuel', 'food', 'morale', 'specialItem'].forEach(key => {
      const value = this.engine.state.resources[key];
      const el = document.getElementById(`${key}Value`);
      el.classList.remove('good', 'warning', 'danger');

      // Special handling for Paranoia (specialItem in Roswell theme)
      // Low paranoia = good, high paranoia = bad (opposite of other resources)
      const isParanoia = key === 'specialItem' &&
                         this.theme.resources.specialItem.name === 'Paranoia';

      if (isParanoia) {
        // Reversed: low values are good, high values are bad
        if (value < 30) el.classList.add('good');
        else if (value < 60) el.classList.add('warning');
        else el.classList.add('danger');
      } else {
        // Normal: high values are good, low values are bad
        if (value > 50) el.classList.add('good');
        else if (value > 20) el.classList.add('warning');
        else el.classList.add('danger');
      }
    });
  }

  /**
   * Update location display
   */
  updateLocationDisplay() {
    const current = this.engine.getCurrentLocation();
    const nextLoc = this.theme.locations[this.engine.state.currentLocationIndex + 1];

    if (this.engine.state.distance === current.distance) {
      document.getElementById('currentLocation').textContent = current.name;
    } else if (nextLoc && this.engine.state.distance < nextLoc.distance) {
      document.getElementById('currentLocation').textContent = `Heading to ${nextLoc.name}`;
    } else {
      document.getElementById('currentLocation').textContent = current.name;
    }

    const progress = this.engine.getProgress();
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent =
      `${Math.floor(this.engine.state.distance)} / ${this.engine.state.totalDistance} miles`;
  }

  /**
   * Update party member status display
   */
  updatePartyStatus() {
    const container = document.getElementById('partyMembers');
    if (!container) {
      console.log('partyMembers container not found!');
      return;
    }

    const statusLabels = this.theme.ui?.statusLabels || {
      normal: '✌️',
      doubting: '💭',
      abandoned: '👔'
    };

    container.innerHTML = '';

    console.log('Party state:', this.engine.state.party);

    if (!this.engine.state.party || this.engine.state.party.length === 0) {
      console.log('Party is empty or undefined!');
      container.innerHTML = '<div style="color: #ff6b6b; padding: 0.5rem;">No party members yet!</div>';
      return;
    }

    let groovy = 0, doubting = 0, abandoned = 0;

    this.engine.state.party.forEach(member => {
      const div = document.createElement('div');
      div.className = 'party-member';
      if (member.doubting) div.classList.add('sick');
      if (member.abandoned) div.classList.add('dead');

      const status = member.abandoned
        ? statusLabels.abandoned
        : member.doubting
        ? statusLabels.doubting
        : statusLabels.normal;

      if (member.abandoned) abandoned++;
      else if (member.doubting) doubting++;
      else groovy++;

      let displayText = `${member.name} - ${status}`;
      if (member.doubting && member.doubt) {
        displayText += ` (${member.doubt})`;
      }
      div.innerHTML = `<span>${displayText}</span>`;
      container.appendChild(div);
    });

    const summaryParts = [];
    if (groovy > 0) summaryParts.push(`${statusLabels.normal}${groovy}`);
    if (doubting > 0) summaryParts.push(`${statusLabels.doubting}${doubting}`);
    if (abandoned > 0) summaryParts.push(`${statusLabels.abandoned}${abandoned}`);

    const summaryEl = document.getElementById('partySummary');
    if (summaryEl) {
      summaryEl.textContent = `(${summaryParts.join(' ')})`;
    }
  }

  /**
   * Check fail conditions and show game over if needed, otherwise show main menu
   */
  checkFailAndShowMenu() {
    const failResult = this.engine.checkFailConditions();
    if (failResult) {
      this.handleFailCondition(failResult);
      return true; // Failed
    }
    this.showMainMenu();
    return false; // Not failed
  }

  /**
   * Show main menu buttons
   */
  showMainMenu() {
    const container = document.getElementById('actionButtons');
    container.innerHTML = '';
    const currentLoc = this.engine.getCurrentLocation();

    // Theme-aware forage button text
    const forageButtonText = this.theme.resources.food.name === 'Evidence'
      ? 'Search for Evidence 🔍'
      : 'Forage for Food';

    const actions = [
      { text: 'Continue Journey', action: () => this.travel() },
      { text: `Buy ${this.theme.resources.fuel.icon} ${this.theme.resources.fuel.name}`, action: () => this.showGasStation(), condition: () => currentLoc.isShop || currentLoc.type === 'checkpoint' },
      { text: 'General Store', action: () => this.showTrade(), condition: () => currentLoc.isShop },
      { text: 'Make Money 💰', action: () => this.showMakeMoney(), condition: () => currentLoc.isShop || currentLoc.type === 'town' },
      { text: forageButtonText, action: () => this.forage() },
      { text: 'Rest', action: () => this.rest() },
      { text: 'Check Supplies', action: () => this.showSupplies() },
      { text: 'Change Pace', action: () => this.showPaceMenu() },
      // Only show rations for food-based themes (not Evidence)
      { text: 'Change Rations', action: () => this.showRationMenu(), condition: () => this.theme.resources.food.name !== 'Evidence' }
    ];

    actions.forEach(action => {
      if (action.condition && !action.condition()) return;

      const btn = document.createElement('button');
      btn.textContent = action.text;
      btn.onclick = action.action;
      container.appendChild(btn);
    });
  }

  /**
   * Travel action
   */
  travel() {
    // Show traveling animation
    this.showTravelAnimation();
  }

  /**
   * Show traveling animation with region-specific imagery
   */
  showTravelAnimation() {
    const vehicleIcon = this.theme.journey.vehicle.icon || '🚐';
    const singleIcon = this.theme.journey.vehicle.singleIcon || vehicleIcon;
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    // Clear event container and buttons COMPLETELY
    eventContainer.innerHTML = '';
    buttonsContainer.innerHTML = '';

    // Get theme-specific event icons
    const eventIcons = this.theme.ui?.eventIcons || {
      positive: '🏈',
      negative: '👨‍👩‍👧',
      neutral: '🥶'
    };

    // Region-specific items that appear above the bus
    // Use theme-configured icons where appropriate
    const regionItemSets = {
      east: [
        [eventIcons.positive, eventIcons.neutral, eventIcons.negative],
        [eventIcons.neutral, eventIcons.positive, eventIcons.negative],
        [eventIcons.positive, eventIcons.negative, eventIcons.neutral],
        [eventIcons.neutral, eventIcons.negative, eventIcons.positive]
      ],
      middle: [
        [eventIcons.positive, eventIcons.neutral, eventIcons.negative],
        [eventIcons.neutral, eventIcons.positive, eventIcons.negative],
        [eventIcons.positive, eventIcons.negative, eventIcons.neutral],
        [eventIcons.positive, eventIcons.positive, eventIcons.positive]
      ],
      west: [
        [eventIcons.positive, eventIcons.neutral, eventIcons.negative],
        [eventIcons.neutral, eventIcons.positive, eventIcons.negative],
        [eventIcons.positive, eventIcons.neutral, eventIcons.negative],
        [eventIcons.neutral, eventIcons.positive, eventIcons.negative]
      ]
    };

    // Determine current region based on distance
    const totalDistance = this.engine.state.totalDistance;
    const currentDistance = this.engine.state.distance;
    const progress = currentDistance / totalDistance;

    let currentRegion;
    if (progress < 0.33) {
      currentRegion = regionItemSets.east;
    } else if (progress < 0.66) {
      currentRegion = regionItemSets.middle;
    } else {
      currentRegion = regionItemSets.west;
    }

    // Pick a random set from current region
    const selectedSet = currentRegion[Math.floor(Math.random() * currentRegion.length)];

    eventContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div id="regionItems" style="font-size: 3rem; margin-bottom: 1rem; display: flex; justify-content: center; gap: 2rem;">
          <span id="regionItem1">${selectedSet[0]}</span>
          <span id="regionItem2">${selectedSet[1]}</span>
          <span id="regionItem3">${selectedSet[2]}</span>
        </div>
        <div class="travel-animation" style="font-size: 6rem;">
          <div class="travel-bus"><pre style="display: inline-block; font-size: 6rem; line-height: 1; margin: 0;">${vehicleIcon}</pre></div>
        </div>
        <div id="travelMessage" style="font-size: 1.5rem; margin-top: 2rem; color: #ffd93d;">Cruising down the highway... ✌️</div>
      </div>
    `;

    // Cycle through travel messages
    const messages = [
      "Cruising down the highway... ✌️",
      "Wind in your hair, far out! 🌬️",
      "The road stretches on forever... 🛣️",
      "Freedom feels GOOD, man! 🌻",
      `Just you, the ${this.theme.journey.vehicle.name.toLowerCase()}, and the open road... ${singleIcon}`
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      const msgEl = document.getElementById('travelMessage');
      if (msgEl) {
        msgEl.textContent = messages[messageIndex];
        messageIndex = (messageIndex + 1) % messages.length;
      }
    }, 2000);

    // End animation after 4 seconds (matching original)
    setTimeout(() => {
      clearInterval(messageInterval);
      // Clear the travel animation before continuing
      eventContainer.innerHTML = '';
      this.continueTraveling();
    }, 4000);
  }

  /**
   * Continue traveling after animation completes
   */
  continueTraveling() {
    const result = this.engine.travel();

    // Check if anyone abandoned this turn
    if (this.engine.state.abandonedThisTurn && this.engine.state.abandonedThisTurn.length > 0) {
      this.showAbandonmentMemorial(this.engine.state.abandonedThisTurn);
      this.engine.state.abandonedThisTurn = []; // Clear the list
      return;
    }

    // Check if reached location or won
    if (result) {
      if (result.type === 'arrival') {
        this.showLocationArrival(result.location);
        return;
      } else if (result.type === 'win') {
        // Check for Area 51 endgame sequence
        if (this.theme.area51Endgame && this.theme.area51Endgame.enabled) {
          this.startArea51Endgame();
        } else {
          this.showWinScreen();
        }
        return;
      }
    }

    // Check fail conditions BEFORE showing events
    const failResult = this.engine.checkFailConditions();
    if (failResult) {
      this.handleFailCondition(failResult);
      return;
    }

    // ALWAYS trigger a random event when traveling (matching original game)
    this.showRandomEvent();
  }

  /**
   * Show memorial screen for abandoned party member
   */
  showAbandonmentMemorial(abandonedMembers) {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    const member = abandonedMembers[0]; // Show one at a time

    // Get theme-specific abandonment text, or default to hippie theme
    const abandonment = this.theme.ui?.abandonment || {
      title: '💔 SOLD OUT 💔',
      icon: '👔',
      quote: '"The establishment got another one..."',
      subtext: 'Press F to pay respects 🕊️'
    };

    eventContainer.innerHTML = `
      <div class="event-box" style="text-align: center; padding: 2rem;">
        <h2 style="color: #ff6b6b; font-size: 3rem; margin-bottom: 1rem;">${abandonment.title}</h2>
        <div style="font-size: 8rem; margin: 2rem 0;">${abandonment.icon}</div>
        <h3 style="font-size: 2rem; color: #ffd93d; margin-bottom: 1rem;">${member.name}</h3>
        <p style="font-size: 1.5rem; margin: 1rem 0; color: #f0e68c;">${member.name} has abandoned the trip.</p>
        <p style="font-size: 1.3rem; margin: 1rem 0; color: #ff6b6b;">They ${member.reason}.</p>
        <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(0,0,0,0.3); border: 2px solid #8b7355;">
          <p style="font-size: 1.2rem; font-style: italic; color: #8b7355;">
            ${abandonment.quote}
          </p>
          <p style="font-size: 1rem; margin-top: 0.5rem; color: #666;">
            ${abandonment.subtext}
          </p>
        </div>
      </div>
    `;

    buttonsContainer.innerHTML = '';
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue Journey';
    continueBtn.onclick = () => {
      this.updateUI();
      this.showMainMenu();
    };
    buttonsContainer.appendChild(continueBtn);
  }

  /**
   * Show location arrival with special handling
   */
  showLocationArrival(location) {
    // Handle special location types
    if (location.specialType) {
      if (location.specialType === 'checkpoint') {
        this.handleCheckpoint(location);
        return;
      } else if (location.specialType === 'minigame') {
        this.handleMinigameLocation(location);
        return;
      } else if (location.specialType === 'mountain') {
        this.handleMountainPass(location);
        return;
      }
    }

    // Show arrival animation first
    this.showArrivalAnimation(location);

    // Then show location details
    setTimeout(() => {
      let message = '';

      if (location.hasLandmark && location.landmarkData) {
        message = `
          <div class="landmark-display">
            <h3>${location.landmarkData.title}</h3>
            <pre>${location.landmarkData.art}</pre>
            <p style="font-size: 1.2rem; margin-top: 1rem;">${location.landmarkData.description}</p>
            ${location.landmarkData.moraleBoost ? `<p style="color: #4ade80; font-size: 1.4rem; margin-top: 1rem;">+${location.landmarkData.moraleBoost} ${this.theme.resources.morale.name}! ✨</p>` : ''}
          </div>
        `;
      } else {
        message = `
          <h2 style="color: #ff6b6b;">📍 ${location.name}</h2>
          <p style="margin-top: 1rem;">You've arrived at ${location.name}.</p>
        `;
      }

      this.showSimpleEvent(message);
      this.updateUI();
      setTimeout(() => this.showMainMenu(), 100);
    }, 2000);
  }

  /**
   * Show arrival animation with bouncing bus
   */
  showArrivalAnimation(location) {
    const eventContainer = document.getElementById('eventContainer');
    const vehicleIcon = this.theme.journey.vehicle.icon || '🚐';

    eventContainer.innerHTML = `
      <div class="travel-animation">
        <div class="travel-bus"><pre style="display: inline-block; font-size: 6rem; line-height: 1; margin: 0;">${vehicleIcon}</pre></div>
        <p style="font-size: 1.5rem; margin-top: 2rem; animation: pulse 1s infinite;">
          Arriving at ${location.name}...
        </p>
      </div>
    `;

    document.getElementById('actionButtons').innerHTML = '';
  }

  /**
   * Handle checkpoint special location
   */
  handleCheckpoint(location) {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    // Show initial checkpoint warning
    eventContainer.innerHTML = `
      <div class="event-box">
        <h2 style="color: #ff6b6b; font-size: 2.5rem;">🚨 CHECKPOINT AHEAD 🚨</h2>
        <p style="font-size: 1.3rem; margin-top: 1rem;">State troopers are checking all vehicles.</p>
        <p style="font-size: 1.1rem; color: #ffd93d; margin-top: 1rem;">Stay cool... Don't look nervous...</p>
      </div>
    `;
    buttonsContainer.innerHTML = '';

    // First delay - building suspense
    setTimeout(() => {
      eventContainer.innerHTML = `
        <div class="event-box">
          <h2 style="color: #ff6b6b;">🚨 CHECKPOINT 🚨</h2>
          <p style="font-size: 1.3rem; margin-top: 1rem;">A trooper approaches your window...</p>
          <p style="font-size: 1.3rem; margin-top: 1rem; animation: pulse 1s infinite;">👮</p>
        </div>
      `;
    }, 1500);

    // Trigger a cop event if profession has high cop target chance
    const copTargetChance = this.engine.state.professionModifiers?.antagonistTargetChance || 0;
    if (Math.random() < (0.5 + copTargetChance)) {
      setTimeout(() => {
        const copEvent = this.findCopEvent();
        if (copEvent) {
          this.showChoiceEvent(copEvent, this.replaceTemplates(copEvent.text));
        } else {
          this.showSimpleEvent('The cop looks suspicious but waves you through. Phew!');
          setTimeout(() => this.showMainMenu(), 1500);
        }
      }, 3500);
    } else {
      setTimeout(() => {
        this.showSimpleEvent(
          `<h3 style="color: #4ade80;">✋ All Clear!</h3>` +
          `<p>The trooper glances in, nods, and waves you through.</p>` +
          `<p style="color: #4ade80;">"Drive safe, folks."</p>` +
          `<p>That was close! Everyone exhales.</p>`
        );
        setTimeout(() => this.showMainMenu(), 2000);
      }, 3500);
    }
  }

  /**
   * Find a cop event from available events
   */
  findCopEvent() {
    const phase = this.engine.getCurrentPhase();
    const events = this.theme.events[phase] || [];
    return events.find(e => e.copEvent === true);
  }

  /**
   * Handle minigame location
   */
  handleMinigameLocation(location) {
    const message = location.landmarkData ?
      `<h3>${location.landmarkData.title}</h3><pre class="ascii-art">${location.landmarkData.art}</pre><p>${location.landmarkData.description}</p>` :
      '<h3>🌊 SPECIAL CHALLENGE</h3><p>A special challenge awaits...</p>';

    this.showSimpleEvent(message);

    // Create minigame if MiniGameEngine is available
    if (typeof MiniGameEngine !== 'undefined' && this.theme.miniGames && this.theme.miniGames.rapids) {
      setTimeout(() => {
        const miniGame = new MiniGameEngine('miniGameContainer', this.theme.miniGames.rapids);
        miniGame.onComplete = (result) => {
          if (result.success) {
            this.engine.state.resources.morale += result.points * 2;
            this.showSimpleEvent(`🌊 You navigated the rapids! +${result.points * 2} ${this.theme.resources.morale.name}!`);
          } else {
            this.engine.state.resources.morale -= 15;
            this.showSimpleEvent(`💥 You crashed in the rapids! -15 ${this.theme.resources.morale.name}!`);
          }
          this.updateUI();
          setTimeout(() => this.showMainMenu(), 2000);
        };
        miniGame.start();
      }, 2000);
    } else {
      setTimeout(() => {
        this.showSimpleEvent('You navigate the challenge carefully and continue on.');
        setTimeout(() => this.showMainMenu(), 2000);
      }, 2000);
    }
  }

  /**
   * Handle mountain pass location
   */
  handleMountainPass(location) {
    const message = location.landmarkData ?
      `<h3>${location.landmarkData.title}</h3><pre class="ascii-art">${location.landmarkData.art}</pre><p>${location.landmarkData.description}</p>` :
      '<h3>⛰️ MOUNTAIN PASS</h3><p>The steep climb ahead will test your bus...</p>';

    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    eventContainer.innerHTML = `<div class="event-box">${message}</div>`;
    buttonsContainer.innerHTML = '';

    // Options for mountain pass
    const goSlowBtn = document.createElement('button');
    goSlowBtn.textContent = '🐢 Go Slow & Steady (-15 gas, -1 day)';
    goSlowBtn.onclick = () => {
      this.engine.state.resources.fuel -= 15;
      this.engine.advanceTime(1);
      this.showSimpleEvent('You take your time and make it over safely!');
      this.updateUI();
      setTimeout(() => this.showMainMenu(), 2000);
    };
    buttonsContainer.appendChild(goSlowBtn);

    const pushItBtn = document.createElement('button');
    pushItBtn.textContent = '🚀 Push It Hard (-25 gas, risk breakdown)';
    pushItBtn.onclick = () => {
      this.engine.state.resources.fuel -= 25;
      if (Math.random() < 0.3) {
        this.showSimpleEvent('💥 Your bus breaks down on the climb! (-$50 repairs, -2 days)');
        this.engine.state.resources.currency -= 50;
        this.engine.advanceTime(2);
      } else {
        this.showSimpleEvent('You gun it and make it over! That was intense!');
      }
      this.updateUI();
      setTimeout(() => this.showMainMenu(), 2000);
    };
    buttonsContainer.appendChild(pushItBtn);

    if (this.engine.state.items.parts && this.engine.state.items.parts > 0) {
      const usePartsBtn = document.createElement('button');
      usePartsBtn.textContent = '🔧 Use Spare Parts (no gas, -1 parts)';
      usePartsBtn.onclick = () => {
        this.engine.state.items.parts--;
        this.showSimpleEvent('You tune up the bus first! Makes it over easily!');
        this.updateUI();
        setTimeout(() => this.showMainMenu(), 2000);
      };
      buttonsContainer.appendChild(usePartsBtn);
    }
  }

  /**
   * Show random event
   */
  showRandomEvent() {
    const event = this.engine.getRandomEvent();
    if (!event) {
      // No event available - just show main menu
      this.updateUI();
      this.showMainMenu();
      return;
    }

    const text = this.replaceTemplates(event.text);

    if (event.isChoice) {
      this.showChoiceEvent(event, text);
    } else {
      // Add effects summary to simple events too
      const textWithEffects = text + this.formatEffects(event.effects || {});
      this.showSimpleEvent(textWithEffects);
      this.engine.applyEffects(event.effects);
      this.updateUI();
      // Show main menu immediately
      this.showMainMenu();
    }
  }

  /**
   * Show simple event message
   */
  showSimpleEvent(text) {
    const container = document.getElementById('eventContainer');
    container.innerHTML = `<div class="message-box">${text}</div>`;
  }

  /**
   * Show choice-based event
   */
  showChoiceEvent(event, text) {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    eventContainer.innerHTML = `<div class="event-box">${text}</div>`;
    buttonsContainer.innerHTML = '';

    event.choices.forEach((choice, index) => {
      // Check if choice is available based on condition
      if (choice.condition && !this.engine.checkEventCondition(choice.condition)) {
        return; // Skip this choice
      }

      const btn = document.createElement('button');
      btn.textContent = this.replaceTemplates(choice.text);
      btn.onclick = () => this.makeChoice(event, choice);
      buttonsContainer.appendChild(btn);
    });
  }

  /**
   * Handle choice selection
   */
  makeChoice(event, choice) {
    // Check for special mini-game choices
    if (choice.special === 'repairGame') {
      this.startRepairMinigame();
      return;
    }

    let message = this.replaceTemplates(choice.message || 'Continued on...');
    let effects = {};
    let endsGame = false;

    // Handle risk
    if (choice.risk && Math.random() < choice.risk) {
      message = this.replaceTemplates(choice.failMessage || message);
      effects = choice.failEffects || {};
      this.engine.applyEffects(effects);
      endsGame = choice.failEndsGame || false;
    } else {
      effects = choice.effects || {};
      this.engine.applyEffects(effects);
      endsGame = choice.endsGame || false;
    }

    // Add effects summary to message
    message += this.formatEffects(effects);

    this.showSimpleEvent(message);
    this.updateUI();

    // Check if choice ends the game
    if (endsGame) {
      setTimeout(() => {
        this.showGameOver(message);
      }, 2000);
      return;
    }

    setTimeout(() => {
      this.showMainMenu();
    }, 100);
  }

  /**
   * Format effects as readable text
   */
  formatEffects(effects) {
    if (!effects || Object.keys(effects).length === 0) return '';

    const parts = [];
    const resourceMap = {
      fuel: this.theme.resources.fuel,
      food: this.theme.resources.food,
      morale: this.theme.resources.morale,
      currency: this.theme.resources.currency,
      specialItem: this.theme.resources.specialItem
    };

    Object.keys(effects).forEach(key => {
      const value = effects[key];
      if (value === 0) return;

      if (resourceMap[key]) {
        const resource = resourceMap[key];
        const prefix = resource.prefix || '';
        const name = resource.name;
        const icon = resource.icon;
        const sign = value > 0 ? '+' : '';
        const color = value > 0 ? '#4ade80' : '#ef4444';
        parts.push(`<span style="color: ${color};">${sign}${prefix}${value} ${name} ${icon}</span>`);
      } else if (key === 'days') {
        const color = '#fbbf24';
        parts.push(`<span style="color: ${color};">+${value} days</span>`);
      } else if (key === 'parts') {
        const sign = value > 0 ? '+' : '';
        const color = value > 0 ? '#4ade80' : '#ef4444';
        parts.push(`<span style="color: ${color};">${sign}${value} spare parts 🔧</span>`);
      }
    });

    return parts.length > 0 ? '<br><br>' + parts.join(' | ') : '';
  }

  /**
   * Start repair mini-game
   */
  startRepairMinigame() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    const parts = ['🔧', '⚙️', '🔩', '💧', '⚡', '🌡️'];
    let timeLeft = 15;
    let fixedParts = 0;
    let currentPart = null;
    let gameInterval = null;
    let flashStartTime = null;

    const startGame = () => {
      eventContainer.innerHTML = `
        <div class="event-box">
          <h2 style="color: #ff6b6b;">🔧 BUS REPAIR MINI-GAME</h2>
          <p>Click the flashing part FAST! (within 250ms)</p>
          <div style="font-size: 1.5rem; margin: 1rem 0; color: #fbbf24;">Time: <span id="repairTimer">${timeLeft}</span>s</div>
          <div style="font-size: 1.5rem; margin: 1rem 0; color: #4ade80;">Fixed: <span id="repairFixed">${fixedParts}</span>/6</div>
          <div id="repairFeedback" style="font-size: 1.2rem; margin: 0.5rem 0; min-height: 1.5rem;"></div>
          <div id="repairParts" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0;"></div>
        </div>
      `;

      buttonsContainer.innerHTML = '';
      const stopBtn = document.createElement('button');
      stopBtn.textContent = 'Give Up';
      stopBtn.classList.add('secondary');
      stopBtn.onclick = () => endGame(false);
      buttonsContainer.appendChild(stopBtn);

      flashNextPart();

      gameInterval = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('repairTimer');
        if (timerEl) timerEl.textContent = timeLeft;

        if (timeLeft <= 0) {
          endGame(false);
        }
      }, 1000);
    };

    const flashNextPart = () => {
      currentPart = parts[Math.floor(Math.random() * parts.length)];
      flashStartTime = Date.now();
      const container = document.getElementById('repairParts');
      if (!container) return;

      container.innerHTML = '';
      parts.forEach(part => {
        const div = document.createElement('div');
        div.style.cssText = 'font-size: 3rem; padding: 1.5rem; border: 2px solid #8b7355; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s;';

        if (part === currentPart) {
          div.style.animation = 'pulse 0.5s infinite';
          div.style.background = 'rgba(255, 107, 107, 0.3)';
          div.style.borderColor = '#ff6b6b';
        }

        div.textContent = part;
        div.onclick = () => clickPart(part);
        container.appendChild(div);
      });
    };

    const clickPart = (part) => {
      const reactionTime = Date.now() - flashStartTime;
      const feedbackEl = document.getElementById('repairFeedback');

      if (part === currentPart && reactionTime <= 250) {
        // SUCCESS - clicked correct part within 250ms
        fixedParts++;
        const fixedEl = document.getElementById('repairFixed');
        if (fixedEl) fixedEl.textContent = fixedParts;

        if (feedbackEl) {
          feedbackEl.innerHTML = `<span style="color: #4ade80;">✓ FIXED! (${reactionTime}ms)</span>`;
        }

        if (fixedParts >= 6) {
          endGame(true);
        } else {
          setTimeout(() => {
            if (feedbackEl) feedbackEl.innerHTML = '';
            flashNextPart();
          }, 400);
        }
      } else if (part === currentPart && reactionTime > 250) {
        // TOO SLOW - clicked correct part but after 250ms
        timeLeft = Math.max(0, timeLeft - 2);
        if (feedbackEl) {
          feedbackEl.innerHTML = `<span style="color: #ff6b6b;">✗ TOO SLOW! (${reactionTime}ms) -2s</span>`;
        }
        setTimeout(() => {
          if (feedbackEl) feedbackEl.innerHTML = '';
          flashNextPart();
        }, 400);
      } else {
        // WRONG PART - clicked wrong part
        timeLeft = Math.max(0, timeLeft - 2);
        if (feedbackEl) {
          feedbackEl.innerHTML = `<span style="color: #ff6b6b;">✗ WRONG PART! -2s</span>`;
        }
        setTimeout(() => {
          if (feedbackEl) feedbackEl.innerHTML = '';
          flashNextPart();
        }, 400);
      }
    };

    const endGame = (success) => {
      if (gameInterval) clearInterval(gameInterval);

      if (success) {
        this.engine.state.resources.morale += 15;
        this.showSimpleEvent(
          `<h2 style="color: #4ade80;">🔧 REPAIR SUCCESS!</h2>` +
          `<p>You fixed the bus yourself! Nice work!</p>` +
          `<p style="color: #4ade80;">+15 ${this.theme.resources.morale.name} ${this.theme.resources.morale.icon} (feeling accomplished!)</p>`
        );
      } else {
        this.engine.state.resources.currency -= 50;
        this.engine.advanceTime(1);
        this.engine.state.resources.morale -= 10;
        this.showSimpleEvent(
          `<h2 style="color: #ef4444;">🔧 REPAIR FAILED</h2>` +
          `<p>You couldn't figure it out. Had to call a mechanic.</p>` +
          `<p style="color: #ef4444;">-$50 | -1 day | -10 ${this.theme.resources.morale.name}</p>`
        );
      }

      this.updateUI();
      setTimeout(() => this.showMainMenu(), 2500);
    };

    startGame();
  }

  /**
   * Hide all screens
   */
  hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
    });
  }

  /**
   * Show win screen
   */
  async showWinScreen() {
    this.hideAllScreens();
    document.getElementById('winScreen').classList.remove('hidden');

    const { state } = this.engine;
    const stillCommitted = state.party.filter(m => !m.abandoned).length;

    // Calculate score using the high score manager's method
    const finalScore = highScoreManager.calculateScore(state, this.theme);

    // Save high score
    const playerName = document.getElementById('playerName')?.value || 'Anonymous';
    const scoreResult = await highScoreManager.addScore(
      this.theme.name,
      playerName,
      finalScore,
      {
        distance: state.distance,
        days: state.day,
        profession: state.professionName,
        survived: stillCommitted
      }
    );

    // Generate epilogue
    const epilogue = this.generateEpilogue(stillCommitted, state);

    const monthNames = ['March', 'April', 'May', 'June', 'July', 'August', 'September'];
    const arrivalDate = `${monthNames[state.month]} ${state.day}`;

    let highScoreMessage = '';
    if (scoreResult.madeTopTen) {
      highScoreMessage = `<div style="background: rgba(74, 222, 128, 0.2); border: 2px solid #4ade80; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <h3 style="color: #4ade80; font-size: 1.5rem;">🏆 HIGH SCORE! 🏆</h3>
        <p style="font-size: 1.2rem;">Rank #${scoreResult.rank} on the leaderboard!</p>
      </div>`;
    }

    document.getElementById('winMessage').textContent = `You made it to ${this.theme.journey.endLocation}!`;
    document.getElementById('winStats').innerHTML = `
      ${highScoreMessage}
      <div style="background: rgba(255, 217, 61, 0.1); border: 2px solid #ffd93d; padding: 1.5rem; margin-bottom: 1.5rem; border-radius: 8px;">
        <h3 style="color: #ffd93d; font-size: 1.8rem; margin-bottom: 1rem;">Your Story</h3>
        <p style="font-size: 1.3rem; line-height: 1.6; color: #f0e68c;">${epilogue}</p>
      </div>
      <strong style="color: #ff6b6b;">Player:</strong> ${playerName}<br>
      <strong style="color: #ff6b6b;">Profession:</strong> ${state.professionName}<br>
      <strong style="color: #ff6b6b;">Multiplier:</strong> ${state.scoreMultiplier}x<br>
      <br>
      Arrival: ${arrivalDate}<br>
      Made it to destination: ${stillCommitted}/4<br>
      Cash: $${Math.floor(state.resources.currency)}<br>
      ${this.theme.resources.morale.name}: ${Math.floor(state.resources.morale)}<br>
      <br>
      <span style="color: #ffd93d; font-size: 2rem;">Final Score: ${highScoreManager.formatScore(finalScore)}</span>
    `;

    this.currentScreen = 'win';
  }

  /**
   * Start Area 51 endgame sequence
   */
  startArea51Endgame() {
    this.area51SequenceIndex = 0;
    this.showArea51Sequence('gate_approach');
  }

  /**
   * Show specific Area 51 sequence by ID
   */
  showArea51Sequence(sequenceId) {
    const sequence = this.theme.area51Endgame.sequences.find(s => s.id === sequenceId);
    if (!sequence) {
      console.error('Sequence not found:', sequenceId);
      this.showWinScreen();
      return;
    }

    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    // Show sequence text
    eventContainer.innerHTML = `
      <div class="event-box" style="text-align: center; padding: 2rem;">
        <pre style="font-size: 1.2rem; line-height: 1.6; color: #f0e68c; white-space: pre-wrap;">${sequence.text}</pre>
      </div>
    `;

    buttonsContainer.innerHTML = '';

    // Handle sequence with choices
    if (sequence.choices) {
      sequence.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.textContent = choice.text;

        // Check if player meets requirements
        if (choice.requires) {
          const meetsRequirements = Object.keys(choice.requires).every(resource => {
            return this.engine.state.resources[resource] >= choice.requires[resource];
          });

          if (!meetsRequirements) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Not enough evidence!';
          }
        }

        btn.onclick = () => {
          if (choice.success && choice.next) {
            this.showArea51Sequence(choice.next);
          } else if (choice.failMessage) {
            this.showGameOver(choice.failMessage);
          }
        };

        buttonsContainer.appendChild(btn);
      });
    }
    // Handle auto-advancing sequence
    else if (sequence.next) {
      setTimeout(() => {
        this.showArea51Sequence(sequence.next);
      }, sequence.delay || 2000);
    }
    // Handle minigame trigger
    else if (sequence.triggersMinigame && sequence.minigame === 'missileCommand') {
      setTimeout(() => {
        this.startMissileCommand();
      }, sequence.delay || 2000);
    }
  }

  /**
   * Show game over screen (failure)
   */
  async showGameOver(message) {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    // Calculate and save score even on failure
    const { state } = this.engine;
    const finalScore = highScoreManager.calculateScore(state, this.theme);
    const playerName = document.getElementById('playerName')?.value || 'Anonymous';
    const stillCommitted = state.party.filter(m => !m.abandoned).length;

    const scoreResult = await highScoreManager.addScore(
      this.theme.name,
      playerName,
      finalScore,
      {
        distance: state.distance,
        days: state.day,
        profession: state.professionName,
        survived: stillCommitted,
        failed: true
      }
    );

    let scoreDisplay = `
      <div style="margin: 1.5rem 0; padding: 1rem; background: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b; border-radius: 8px;">
        <p><strong>Player:</strong> ${playerName}</p>
        <p><strong>Distance:</strong> ${Math.floor(state.distance)} miles</p>
        <p><strong>Score:</strong> <span style="color: #ffd93d; font-size: 1.3rem;">${highScoreManager.formatScore(finalScore)}</span></p>
        ${scoreResult.madeTopTen ? `<p style="color: #4ade80; font-weight: bold;">🏆 Rank #${scoreResult.rank} on leaderboard!</p>` : ''}
      </div>
    `;

    eventContainer.innerHTML = `
      <div class="event-box" style="text-align: center; padding: 2rem;">
        <h2 style="color: #ff6b6b; font-size: 2.5rem; margin-bottom: 2rem;">GAME OVER</h2>
        <p style="font-size: 1.3rem; color: #f0e68c;">${message}</p>
        ${scoreDisplay}
      </div>
    `;

    buttonsContainer.innerHTML = '';
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Return to Theme Selection';
    restartBtn.onclick = () => location.reload();
    buttonsContainer.appendChild(restartBtn);
  }

  /**
   * Start Missile Command minigame
   */
  startMissileCommand() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    // Create game canvas
    eventContainer.innerHTML = `
      <div class="event-box" style="padding: 1rem; background: #000;">
        <h3 style="color: #00ff00; text-align: center; font-family: monospace;">
          🚀 MISSILE DEFENSE SYSTEM 🚀
        </h3>
        <div style="text-align: center; color: #00ff00; font-family: monospace; margin-bottom: 0.5rem;">
          <span id="mc-score">Hits: 0</span> |
          <span id="mc-cities">Cities: 6</span> |
          <span id="mc-ammo">Ammo: 30</span>
        </div>
        <canvas id="missileCommandCanvas" width="800" height="600" style="border: 2px solid #00ff00; display: block; margin: 0 auto; background: #000; width: 100%; max-width: 800px; touch-action: none;"></canvas>
        <p style="color: #ff6b6b; text-align: center; margin-top: 0.5rem; font-size: 0.9rem;">
          Click or tap to fire missiles! Defend the cities from alien attack!
        </p>
      </div>
    `;

    buttonsContainer.innerHTML = '';

    // Initialize missile command game
    this.initMissileCommand();
  }

  /**
   * Initialize and run Missile Command game
   */
  initMissileCommand() {
    const canvas = document.getElementById('missileCommandCanvas');
    const ctx = canvas.getContext('2d');

    // Game state
    const game = {
      running: true,
      score: 0,
      cities: 6,
      ammo: 30,
      missiles: [],      // Enemy missiles (UFOs)
      explosions: [],    // Player missile explosions
      playerMissiles: [], // Player missiles in flight
      citiesAlive: [true, true, true, true, true, true],
      difficulty: 1,
      wave: 1,
      transitioning: false
    };

    // City positions
    const cityPositions = [
      { x: 100, y: 580 },
      { x: 200, y: 580 },
      { x: 300, y: 580 },
      { x: 500, y: 580 },
      { x: 600, y: 580 },
      { x: 700, y: 580 }
    ];

    // Turret position (center bottom)
    const turretPos = { x: 400, y: 580 };

    // Spawn enemy missiles
    const spawnMissile = () => {
      if (!game.running) return;

      const targetCity = Math.floor(Math.random() * 6);
      const target = cityPositions[targetCity];

      game.missiles.push({
        x: Math.random() * canvas.width,
        y: 0,
        targetX: target.x,
        targetY: target.y,
        speed: 1 + (game.difficulty * 0.3),
        alive: true
      });
    };

    // Fire missile function (shared between click and touch)
    const fireMissile = (clientX, clientY) => {
      if (!game.running || game.ammo <= 0) return;

      const rect = canvas.getBoundingClientRect();
      // Account for canvas scaling on mobile
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const targetX = (clientX - rect.left) * scaleX;
      const targetY = (clientY - rect.top) * scaleY;

      // Fire player missile
      game.ammo--;
      game.playerMissiles.push({
        x: turretPos.x,
        y: turretPos.y,
        targetX: targetX,
        targetY: targetY,
        speed: 5,
        alive: true
      });

      const ammoElement = document.getElementById('mc-ammo');
      if (ammoElement) {
        ammoElement.textContent = `Ammo: ${game.ammo}`;
      }
    };

    // Click handler (desktop)
    canvas.addEventListener('click', (e) => {
      fireMissile(e.clientX, e.clientY);
    });

    // Touch handler (mobile)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent scrolling
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        fireMissile(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    // Additional touch handler for better responsiveness
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Game loop
    const gameLoop = () => {
      if (!game.running) return;

      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 590, canvas.width, 10);

      // Draw cities
      cityPositions.forEach((pos, i) => {
        if (game.citiesAlive[i]) {
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(pos.x - 10, pos.y - 20, 20, 20);
          ctx.fillText('🏙️', pos.x - 10, pos.y - 5);
        } else {
          ctx.fillStyle = '#ff0000';
          ctx.fillText('💥', pos.x - 10, pos.y - 5);
        }
      });

      // Draw turret
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(turretPos.x, turretPos.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw enemy missiles (UFOs)
      game.missiles = game.missiles.filter(m => {
        if (!m.alive) return false;

        // Move missile toward target
        const dx = m.targetX - m.x;
        const dy = m.targetY - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < m.speed) {
          // Hit city
          const cityIndex = cityPositions.findIndex(c =>
            Math.abs(c.x - m.targetX) < 20 && Math.abs(c.y - m.targetY) < 20
          );
          if (cityIndex !== -1 && game.citiesAlive[cityIndex]) {
            game.citiesAlive[cityIndex] = false;
            game.cities--;
            const citiesElement = document.getElementById('mc-cities');
            if (citiesElement) {
              citiesElement.textContent = `Cities: ${game.cities}`;
            }
          }
          return false;
        }

        m.x += (dx / dist) * m.speed;
        m.y += (dy / dist) * m.speed;

        // Draw enemy missile (UFO)
        ctx.fillStyle = '#ff0000';
        ctx.fillText('🛸', m.x - 10, m.y);

        // Draw trail
        ctx.strokeStyle = '#ff000055';
        ctx.beginPath();
        ctx.moveTo(m.x, 0);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        return true;
      });

      // Update and draw player missiles
      game.playerMissiles = game.playerMissiles.filter(pm => {
        if (!pm.alive) return false;

        const dx = pm.targetX - pm.x;
        const dy = pm.targetY - pm.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pm.speed) {
          // Create explosion
          game.explosions.push({
            x: pm.targetX,
            y: pm.targetY,
            radius: 0,
            maxRadius: 50,
            growing: true
          });
          return false;
        }

        pm.x += (dx / dist) * pm.speed;
        pm.y += (dy / dist) * pm.speed;

        // Draw player missile
        ctx.strokeStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(turretPos.x, turretPos.y);
        ctx.lineTo(pm.x, pm.y);
        ctx.stroke();

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(pm.x, pm.y, 3, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Update and draw explosions
      game.explosions = game.explosions.filter(ex => {
        if (ex.growing) {
          ex.radius += 2;
          if (ex.radius >= ex.maxRadius) {
            ex.growing = false;
          }
        } else {
          ex.radius -= 1;
          if (ex.radius <= 0) return false;
        }

        // Check collision with enemy missiles
        game.missiles.forEach(m => {
          if (m.alive) {
            const dx = m.x - ex.x;
            const dy = m.y - ex.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < ex.radius) {
              m.alive = false;
              game.score++;
              const scoreElement = document.getElementById('mc-score');
              if (scoreElement) {
                scoreElement.textContent = `Hits: ${game.score}`;
              }
            }
          }
        });

        // Draw explosion
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
        ctx.stroke();

        return true;
      });

      // Check wave completion and progression
      if (waveComplete && game.missiles.length === 0 && !game.transitioning) {
        game.transitioning = true; // Prevent multiple transitions
        console.log(`Wave ${game.wave} complete! Missiles cleared.`);

        // All missiles cleared for this wave
        if (game.wave >= 3) {
          // Completed wave 3 - you win!
          console.log('All 3 waves complete - YOU WIN!');
          game.running = false;
          this.endMissileCommand(true, game.score);
          return;
        }

        // Start next wave
        game.wave++;
        game.difficulty++;
        game.ammo += 10;
        console.log(`Starting wave ${game.wave}...`);
        const ammoElement = document.getElementById('mc-ammo');
        if (ammoElement) {
          ammoElement.textContent = `Ammo: ${game.ammo}`;
        }

        // Reset for next wave
        spawnCount = 0;
        waveComplete = false;
        game.transitioning = false;

        // Start spawning next wave
        clearInterval(spawnInterval);
        spawnInterval = setInterval(() => {
          if (!game.running) {
            clearInterval(spawnInterval);
            return;
          }

          spawnMissile();
          spawnCount++;
          console.log(`Spawned missile ${spawnCount} for wave ${game.wave}`);

          if (spawnCount >= 15 + (game.wave * 5)) {
            clearInterval(spawnInterval);
            waveComplete = true;
            console.log(`Wave ${game.wave} spawning complete. Waiting for missiles to clear...`);
          }
        }, 1500 - (game.wave * 200));
      }

      // Check win/lose conditions
      if (game.cities <= 0) {
        game.running = false;
        this.endMissileCommand(false, game.score);
        return;
      }

      requestAnimationFrame(gameLoop);
    };

    // Start spawning missiles
    let spawnCount = 0;
    let waveComplete = false;
    const maxSpawns = 15 + (game.wave * 5);
    let spawnInterval = setInterval(() => {
      if (!game.running) {
        clearInterval(spawnInterval);
        return;
      }

      spawnMissile();
      spawnCount++;

      if (spawnCount >= maxSpawns) {
        clearInterval(spawnInterval);
        waveComplete = true;
      }
    }, 1500 - (game.wave * 200));

    // Start game loop
    gameLoop();
  }

  /**
   * End Missile Command minigame
   */
  endMissileCommand(won, score) {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    if (won) {
      // Victory - show the memory wipe ending sequence
      this.showMemoryWipeEnding(score);
    } else {
      eventContainer.innerHTML = `
        <div class="event-box" style="text-align: center; padding: 2rem;">
          <h2 style="color: #ff6b6b; font-size: 3rem; margin-bottom: 1rem;">💀 DEFEAT 💀</h2>
          <pre style="font-size: 1.2rem; color: #ff6b6b; margin: 2rem 0;">
     🛸 THE GREYS HAVE WON 🛸

    The cities are destroyed.
    Earth has fallen.

    You found the truth...
    but it wasn't enough.
          </pre>
          <p style="font-size: 1.5rem; color: #ffd93d;">Score: ${score}</p>
        </div>
      `;

      buttonsContainer.innerHTML = '';
      const restartBtn = document.createElement('button');
      restartBtn.textContent = 'Play Again';
      restartBtn.onclick = () => location.reload();
      buttonsContainer.appendChild(restartBtn);
    }
  }

  /**
   * Show the memory wipe ending sequence
   */
  showMemoryWipeEnding(score) {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    // Calculate bonus points
    let bonusPoints = 0;
    let daysRemaining = 0;
    if (this.theme.mystery && this.theme.mystery.enabled) {
      daysRemaining = this.theme.mystery.timeLimit - this.engine.state.day;
      bonusPoints = Math.max(0, daysRemaining * this.theme.mystery.bonusPointsPerDay);
    }
    const finalScore = score + bonusPoints;

    // First: Victory at Area 51
    eventContainer.innerHTML = `
      <div class="event-box" style="text-align: center; padding: 2rem;">
        <h2 style="color: #00ff00; font-size: 2.5rem; margin-bottom: 1rem;">👽 INVASION REPELLED! 👽</h2>
        <p style="font-size: 1.3rem; color: #4ade80; margin: 1rem 0;">
          You did it! Earth is saved!
        </p>
        <p style="font-size: 1.2rem; color: #ffd93d; margin: 1rem 0;">
          The military rushes in... everything goes white...
        </p>
      </div>
    `;
    buttonsContainer.innerHTML = '';

    // Second: Three weeks later
    setTimeout(() => {
      eventContainer.innerHTML = `
        <div class="event-box" style="padding: 2rem;">
          <h2 style="color: #ffd93d; font-size: 2rem; margin-bottom: 1.5rem; text-align: center;">
            🏠 THREE WEEKS LATER 🏠
          </h2>
          <p style="font-size: 1.2rem; line-height: 1.8; color: #f0e68c; margin: 1rem 0;">
            You're back home. Everything feels... normal?
          </p>
          <p style="font-size: 1.2rem; line-height: 1.8; color: #f0e68c; margin: 1rem 0;">
            The last three weeks are a complete blur. You can't remember anything about the trip.
            Where did you go? What did you see?
          </p>
          <p style="font-size: 1.2rem; line-height: 1.8; color: #ff6b6b; margin: 1rem 0;">
            Your party members are equally confused. None of you can explain what happened.
          </p>
          <p style="font-size: 1.3rem; line-height: 1.8; color: #ffd93d; margin: 2rem 0; text-align: center;">
            *KNOCK KNOCK KNOCK*
          </p>
        </div>
      `;
    }, 3000);

    // Third: The photo reveal
    setTimeout(() => {
      eventContainer.innerHTML = `
        <div class="event-box" style="padding: 2rem;">
          <h2 style="color: #4ade80; font-size: 2rem; margin-bottom: 1.5rem; text-align: center;">
            🚪 THE DOOR 🚪
          </h2>
          <p style="font-size: 1.2rem; line-height: 1.8; color: #f0e68c; margin: 1rem 0;">
            One of your party members stands at the door, eyes wide with panic.
          </p>
          <p style="font-size: 1.2rem; line-height: 1.8; color: #f0e68c; margin: 1rem 0;">
            "I found this in my camera bag... I don't remember taking it..."
          </p>
          <p style="font-size: 1.2rem; line-height: 1.8; color: #4ade80; margin: 1.5rem 0;">
            They hand you a photo. It's blurry, out of focus, but unmistakable:
          </p>
          <pre style="font-size: 1.5rem; color: #00ff00; text-align: center; margin: 2rem 0; line-height: 1.2;">
    ✨  ✨  ✨
      🛸
    ═══════
     👤👤👤
          </pre>
          <p style="font-size: 1.3rem; line-height: 1.8; color: #ff6b6b; margin: 1.5rem 0; text-align: center;">
            "They wiped our memories... but they missed this photo."
          </p>
          <p style="font-size: 1.4rem; line-height: 1.8; color: #ffd93d; margin: 2rem 0; font-weight: bold; text-align: center;">
            Something IS out there.
          </p>
          <div style="margin-top: 3rem; padding: 1.5rem; background: rgba(0,0,0,0.3); border: 2px solid #4ade80;">
            <p style="font-size: 1.2rem; color: #4ade80; margin: 0.5rem 0;">Missile Command Score: ${score}</p>
            ${daysRemaining > 0 ? `
              <p style="font-size: 1.2rem; color: #ffd93d; margin: 0.5rem 0;">
                ⏰ Days Remaining: ${daysRemaining} (+${bonusPoints} bonus)
              </p>
            ` : ''}
            <p style="font-size: 1.5rem; color: #00ff00; margin: 1rem 0; font-weight: bold;">
              FINAL SCORE: ${finalScore}
            </p>
            <p style="font-size: 1rem; color: #8b7355; margin-top: 1rem; font-style: italic;">
              The truth is still out there...
            </p>
          </div>
        </div>
      `;

      buttonsContainer.innerHTML = '';
      const restartBtn = document.createElement('button');
      restartBtn.textContent = 'Play Again';
      restartBtn.onclick = () => location.reload();
      buttonsContainer.appendChild(restartBtn);
    }, 6500);
  }

  /**
   * Generate epilogue based on journey (theme-driven)
   */
  generateEpilogue(stillCommitted, state) {
    if (!this.theme.epilogues) {
      return "Your journey is complete!";
    }

    // Find first matching epilogue
    for (const epilogueSet of this.theme.epilogues) {
      if (this.checkEpilogueCondition(epilogueSet.condition, stillCommitted, state)) {
        return this.getEpilogueText(epilogueSet, stillCommitted, state);
      }
    }

    return "Your journey is complete!";
  }

  /**
   * Check if epilogue conditions match
   */
  checkEpilogueCondition(condition, partySize, state) {
    // Check morale range
    if (condition.morale) {
      if (condition.morale.min !== undefined && state.resources.morale < condition.morale.min) return false;
      if (condition.morale.max !== undefined && state.resources.morale > condition.morale.max) return false;
    }

    // Check currency range
    if (condition.currency) {
      if (condition.currency.min !== undefined && state.resources.currency < condition.currency.min) return false;
      if (condition.currency.max !== undefined && state.resources.currency > condition.currency.max) return false;
    }

    // Check party size
    if (condition.partySize !== undefined) {
      if (typeof condition.partySize === 'number') {
        if (partySize !== condition.partySize) return false;
      } else {
        if (condition.partySize.min !== undefined && partySize < condition.partySize.min) return false;
        if (condition.partySize.max !== undefined && partySize > condition.partySize.max) return false;
      }
    }

    // Check profession
    if (condition.profession && state.profession !== condition.profession) return false;

    return true;
  }

  /**
   * Get epilogue text from matched set
   */
  getEpilogueText(epilogueSet, partySize, state) {
    // Random selection from array
    if (epilogueSet.endings) {
      return epilogueSet.endings[Math.floor(Math.random() * epilogueSet.endings.length)];
    }

    // Profession-specific endings
    if (epilogueSet.professionEndings) {
      return epilogueSet.professionEndings[state.profession] || epilogueSet.professionEndings.default || "Your journey is complete!";
    }

    // Item-based endings
    if (epilogueSet.itemEndings) {
      for (const item in state.items) {
        if (state.items[item] && epilogueSet.itemEndings[item]) {
          return epilogueSet.itemEndings[item];
        }
      }
      return epilogueSet.itemEndings.default || "Your journey is complete!";
    }

    // Morale-based endings
    if (epilogueSet.moraleEndings) {
      const moraleLevel = state.resources.morale >= 60 ? 'high' : 'low';
      return epilogueSet.moraleEndings[moraleLevel] || "Your journey is complete!";
    }

    // Template string with replacements
    if (epilogueSet.template) {
      let text = epilogueSet.template;
      text = text.replace('{{partySizeIcon}}', partySize === 1 ? '💔' : '🥀');
      return text;
    }

    // Single ending
    if (epilogueSet.ending) {
      return epilogueSet.ending;
    }

    return "Your journey is complete!";
  }

  /**
   * Show supplies menu
   */
  showSupplies() {
    const { state } = this.engine;
    const { resources } = this.theme;

    const message = `
      <h3>Current Supplies:</h3>
      <p>${resources.fuel.icon} ${resources.fuel.name}: ${Math.floor(state.resources.fuel)}/${resources.fuel.max}</p>
      <p>${resources.food.icon} ${resources.food.name}: ${Math.floor(state.resources.food)}/${resources.food.max}</p>
      <p>${resources.morale.icon} ${resources.morale.name}: ${Math.floor(state.resources.morale)}/${resources.morale.max}</p>
      <p>${resources.currency.icon} ${resources.currency.name}: ${resources.currency.prefix}${Math.floor(state.resources.currency)}</p>
      <p>${resources.specialItem.icon} ${resources.specialItem.name}: ${Math.floor(state.resources.specialItem)}/${resources.specialItem.max}</p>
      ${state.items.guitar ? '<p>🎸 Guitar</p>' : ''}
      ${state.items.parts ? `<p>🔧 Spare Parts: ${state.items.parts}</p>` : ''}
    `;

    this.showSimpleEvent(message);
    setTimeout(() => this.showMainMenu(), 100);
  }

  /**
   * Show pace menu
   */
  showPaceMenu() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    eventContainer.innerHTML = `<div class="event-box">
      <h3>Change Travel Pace</h3>
      <p><strong>Mellow:</strong> 30 miles/day, 8 gas/day, +2 ${this.theme.resources.morale.name.toLowerCase()}</p>
      <p><strong>Steady:</strong> 50 miles/day, 12 gas/day, normal</p>
      <p><strong>Rush:</strong> 70 miles/day, 18 gas/day, -3 ${this.theme.resources.morale.name.toLowerCase()}</p>
    </div>`;

    buttonsContainer.innerHTML = '';
    ['mellow', 'steady', 'rush'].forEach(pace => {
      const btn = document.createElement('button');
      btn.textContent = pace.charAt(0).toUpperCase() + pace.slice(1);
      if (this.engine.state.pace === pace) btn.classList.add('secondary');
      btn.onclick = () => {
        this.engine.state.pace = pace;
        this.showSimpleEvent(`Pace set to ${pace}.`);
        setTimeout(() => this.showMainMenu(), 1000);
      };
      buttonsContainer.appendChild(btn);
    });
  }

  /**
   * Show ration menu
   */
  showRationMenu() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    eventContainer.innerHTML = `<div class="event-box">
      <h3>Change Food Rations</h3>
      <p><strong>🍞 Bare Bones:</strong> Save ${this.theme.resources.food.name.toLowerCase()} (4/day), bad ${this.theme.resources.morale.name.toLowerCase()}</p>
      <p><strong>🍔 Normal:</strong> Balanced (8/day) - RECOMMENDED</p>
      <p><strong>🍕 Feast:</strong> Lots of ${this.theme.resources.food.name.toLowerCase()} (15/day), great ${this.theme.resources.morale.name.toLowerCase()}!</p>
    </div>`;

    buttonsContainer.innerHTML = '';
    ['bare', 'normal', 'feast'].forEach(ration => {
      const btn = document.createElement('button');
      btn.textContent = ration.charAt(0).toUpperCase() + ration.slice(1);
      if (this.engine.state.rations === ration) btn.classList.add('secondary');
      btn.onclick = () => {
        this.engine.state.rations = ration;
        this.showSimpleEvent(`Rations set to ${ration}.`);
        setTimeout(() => this.showMainMenu(), 1000);
      };
      buttonsContainer.appendChild(btn);
    });
  }

  /**
   * Rest action
   */
  rest() {
    const result = this.engine.rest();
    this.showSimpleEvent(result.message);
    this.updateUI();
    setTimeout(() => this.checkFailAndShowMenu(), 2000);
  }

  /**
   * Show shop/trade menu
   */
  showTrade() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    eventContainer.innerHTML = `<div class="event-box">
      <h3>🛒 General Store</h3>
      <p>Your Cash: $${Math.floor(this.engine.state.resources.currency)}</p>
    </div>`;

    buttonsContainer.innerHTML = '';

    this.theme.shop.items.forEach(item => {
      const btn = document.createElement('button');
      btn.textContent = `${item.icon} ${item.name} - $${item.cost}`;
      btn.onclick = () => {
        const result = this.engine.buyItem(item.id);
        this.showSimpleEvent(result.message);
        this.updateUI();
        if (result.success) {
          setTimeout(() => this.showTrade(), 1500);
        } else {
          setTimeout(() => this.showTrade(), 1000);
        }
      };
      buttonsContainer.appendChild(btn);
    });

    const leaveBtn = document.createElement('button');
    leaveBtn.textContent = 'Leave Store';
    leaveBtn.classList.add('secondary');
    leaveBtn.onclick = () => this.showMainMenu();
    buttonsContainer.appendChild(leaveBtn);
  }

  /**
   * Forage mini-game
   */
  forage() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    // Hide main game buttons
    buttonsContainer.innerHTML = '';

    // Adjust timer based on weather
    let timeLeft = this.engine.state.weather === 'hot' ? 4 : 5;
    this.forageState = {
      timeLeft: timeLeft,
      collected: 0,
      interval: null
    };

    // Theme-aware text
    const forageTitle = this.theme.resources.food.name === 'Evidence' ?
      `🔍 SEARCH FOR EVIDENCE 🔍` :
      `🌿 FORAGING TIME 🌿`;
    const forageInstruction = this.theme.resources.food.name === 'Evidence' ?
      'Click on evidence before time runs out!' :
      'Click on the food items before time runs out!';
    const forageCounter = this.theme.resources.food.name === 'Evidence' ?
      'Evidence Found: 0 files' :
      'Food Collected: 0 lbs';
    const stopButtonText = this.theme.resources.food.name === 'Evidence' ?
      'Stop Searching' :
      'Stop Foraging';

    // Show foraging UI
    eventContainer.innerHTML = `
      <div class="event-box">
        <h2 style="color: #4caf50; font-size: 2.5rem; margin-bottom: 1rem;">${forageTitle}</h2>
        <p id="forageInstructions">${forageInstruction}</p>
        <div style="font-size: 1.5rem; margin: 1rem 0; color: #fbbf24;" id="forageTimer">Time: ${timeLeft}s</div>
        <div id="forageCounter" style="font-size: 1.8rem; margin-bottom: 1rem;">${forageCounter}</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1rem 0;" id="forageItems"></div>
      </div>
    `;

    const stopBtn = document.createElement('button');
    stopBtn.textContent = stopButtonText;
    stopBtn.classList.add('secondary');
    stopBtn.onclick = () => this.endForaging();
    buttonsContainer.appendChild(stopBtn);

    this.startForaging();
  }

  startForaging() {
    if (!this.forageState) return;

    // Determine current location type
    const currentLoc = this.engine.getCurrentLocation();
    const isUrban = currentLoc.isShop || currentLoc.type === 'checkpoint';

    // Determine region based on distance
    const progress = this.engine.state.distance / this.engine.state.totalDistance;
    let region = 'early';
    if (progress >= 0.33 && progress < 0.66) region = 'middle';
    else if (progress >= 0.66) region = 'late';

    // Region-specific and geographic items
    let items = [];

    // Use evidence icons for Roswell Trail, food icons for NorCal Trail
    if (this.theme.resources.food.name === 'Evidence') {
      // Evidence-themed items for conspiracy theme
      if (isUrban) {
        // Urban searching - more disinformation risk!
        if (region === 'early') {
          items = ['📄', '📁', '💾', '🚫', '🚫', '📋', '🚫', '🔖'];
        } else if (region === 'middle') {
          items = ['📸', '📁', '💿', '🚫', '🚫', '📋', '🚫', '🎞️'];
        } else { // late
          items = ['🛸', '👽', '📡', '🚫', '🚫', '🚫', '📹', '💾'];
        }
      } else {
        // Rural/desert searching - less disinformation, more alien evidence
        if (region === 'early') {
          items = ['📄', '📸', '💾', '🔍', '📋', '📁', '🎞️', '🚫'];
        } else if (region === 'middle') {
          items = ['📡', '📹', '💿', '📋', '📁', '🔖', '📸', '🚫'];
        } else { // late (near Area 51)
          items = ['🛸', '👽', '📡', '💾', '📹', '🎞️', '📸', '🚫'];
        }
      }

      // Weather affects item distribution
      if (this.engine.state.weather === 'bad') {
        // More disinformation in bad conditions
        items = items.slice(0, 4).concat(['🚫', '🚫', '🚫', '🚫']);
      } else if (this.engine.state.weather === 'hot') {
        // More disinformation in heat
        items = items.filter(i => !['📸', '🎞️', '📁'].includes(i)).concat(['🚫', '🚫']);
      }
    } else {
      // Food-themed items for NorCal Trail theme
      if (isUrban) {
        // Urban foraging - more trash risk!
        if (region === 'early') {
          items = ['🍎', '🥕', '🍞', '🗑️', '🗑️', '🥔', '🗑️', '🍇'];
        } else if (region === 'middle') {
          items = ['🌽', '🥕', '🍞', '🗑️', '🗑️', '🥔', '🗑️', '🍇'];
        } else { // late
          items = ['🍊', '🥑', '🍞', '🗑️', '🗑️', '🗑️', '🌰', '🍇'];
        }
      } else {
        // Rural/nature foraging - less trash, region-specific foods
        if (region === 'early') {
          items = ['🍎', '🍓', '🥕', '🍄', '🌰', '🥦', '🐟', '🗑️'];
        } else if (region === 'middle') {
          items = ['🌽', '🥔', '🍄', '🌰', '🥕', '🐟', '🍇', '🗑️'];
        } else { // late
          items = ['🍊', '🥑', '🍋', '🌵', '🍄', '🐟', '🌰', '🗑️'];
        }
      }

      // Weather affects item distribution
      if (this.engine.state.weather === 'bad') {
        // More trash in bad weather
        items = items.slice(0, 4).concat(['🗑️', '🗑️', '🗑️', '🗑️']);
      } else if (this.engine.state.weather === 'hot') {
        // More trash, less fresh food in heat
        items = items.filter(i => !['🍓', '🍇', '🥦'].includes(i)).concat(['🗑️', '🗑️']);
      }
    }

    const container = document.getElementById('forageItems');
    if (!container) return;

    container.innerHTML = '';

    // Generate random items
    for (let i = 0; i < 12; i++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const div = document.createElement('div');
      div.style.cssText = 'font-size: 3rem; cursor: pointer; padding: 1rem; background: rgba(76, 175, 80, 0.2); border: 2px solid #4caf50; border-radius: 8px; text-align: center; transition: all 0.2s;';
      div.textContent = item;
      div.onclick = () => this.collectForageItem(div, item);
      container.appendChild(div);
    }

    // Start timer
    if (this.forageState.interval) clearInterval(this.forageState.interval);

    this.forageState.interval = setInterval(() => {
      this.forageState.timeLeft--;
      const timerEl = document.getElementById('forageTimer');
      if (timerEl) timerEl.textContent = `Time: ${this.forageState.timeLeft}s`;

      if (this.forageState.timeLeft <= 0) {
        this.endForaging();
      } else if (this.forageState.timeLeft % 3 === 0) {
        // Refresh items
        this.startForaging();
      }
    }, 1000);
  }

  collectForageItem(element, item) {
    if (!this.forageState || element.style.opacity === '0.3') return;

    const badItem = this.theme.resources.food.name === 'Evidence' ? '🚫' : '🗑️';

    if (item === badItem) {
      // INSTANT FAIL - Hit bad item!
      if (this.forageState.interval) clearInterval(this.forageState.interval);
      element.style.background = 'rgba(239, 68, 68, 0.3)';
      element.style.opacity = '0.3';

      const instructEl = document.getElementById('forageInstructions');
      if (instructEl) {
        if (this.theme.resources.food.name === 'Evidence') {
          instructEl.textContent = "🚫 DISINFORMATION! That's fake!";
        } else {
          instructEl.textContent = "💀 FOOD POISONING! That wasn't food!";
        }
        instructEl.style.color = '#ef4444';
      }

      setTimeout(() => {
        this.engine.state.resources.food = Math.max(0, this.engine.state.resources.food - 10);
        this.engine.state.resources.morale = Math.max(0, this.engine.state.resources.morale - 15);

        if (this.theme.resources.food.name === 'Evidence') {
          this.showSimpleEvent(
            `<h3 style="color: #ff6b6b;">🚫 DISINFORMATION! 🤥</h3>` +
            `<p>You grabbed fake evidence! It contradicts everything you know!</p>` +
            `<p style="color: #ff6b6b;"><strong>-10 ${this.theme.resources.food.name} | -15 ${this.theme.resources.morale.name}</strong></p>` +
            `<p>Everyone's disappointed. 'We need to be more careful...'</p>`
          );
        } else {
          this.showSimpleEvent(
            `<h3 style="color: #ff6b6b;">🗑️ TRASH BIN! 🤢</h3>` +
            `<p>You grabbed a trash bin by mistake! Food poisoning hits HARD!</p>` +
            `<p style="color: #ff6b6b;"><strong>-10 ${this.theme.resources.food.name} | -15 ${this.theme.resources.morale.name}</strong></p>` +
            `<p>Everyone's disappointed. 'Let's just buy food next time...'</p>`
          );
        }

        this.updateUI();
        this.forageState = null;
        setTimeout(() => this.showMainMenu(), 2000);
      }, 1500);
      return;
    } else {
      const amount = Math.floor(Math.random() * 3) + 2;
      this.forageState.collected += amount;
    }

    element.style.background = 'rgba(76, 175, 80, 0.5)';
    element.style.opacity = '0.3';
    const counterEl = document.getElementById('forageCounter');
    if (counterEl) {
      if (this.theme.resources.food.name === 'Evidence') {
        counterEl.textContent = `Evidence Found: ${this.forageState.collected} files`;
      } else {
        counterEl.textContent = `Food Collected: ${this.forageState.collected} lbs`;
      }
    }
  }

  endForaging() {
    if (!this.forageState) return;

    if (this.forageState.interval) clearInterval(this.forageState.interval);

    const collected = this.forageState.collected;
    this.forageState = null;

    if (collected > 0) {
      this.engine.state.resources.food = Math.min(this.theme.resources.food.max, this.engine.state.resources.food + collected);

      if (this.theme.resources.food.name === 'Evidence') {
        this.showSimpleEvent(
          `<h3 style="color: #4caf50;">🔍 Search Complete!</h3>` +
          `<p>You found <strong>${collected} files</strong> of evidence!</p>` +
          `<p>The truth is out there! 👽</p>`
        );
      } else {
        this.showSimpleEvent(
          `<h3 style="color: #4caf50;">🌿 Foraging Complete!</h3>` +
          `<p>You collected <strong>${collected} lbs</strong> of food!</p>` +
          `<p>Not bad for scrounging around! ✌️</p>`
        );
      }
    } else {
      if (this.theme.resources.food.name === 'Evidence') {
        this.showSimpleEvent(
          `<h3 style="color: #fbbf24;">🤷 No Evidence Found</h3>` +
          `<p>You didn't find any solid evidence this time. Keep searching!</p>`
        );
      } else {
        this.showSimpleEvent(
          `<h3 style="color: #fbbf24;">🤷 No Food Found</h3>` +
          `<p>You didn't find any food this time. Better luck next time!</p>`
        );
      }
    }

    this.updateUI();
    setTimeout(() => this.checkFailAndShowMenu(), 2000);
  }

  /**
   * Show Make Money options
   */
  showMakeMoney() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');
    const currentLoc = this.engine.getCurrentLocation();

    eventContainer.innerHTML = `
      <div class="event-box">
        <h3 style="color: #4ade80; margin-bottom: 1rem;">💰 Make Some Cash</h3>
        <p>You need money. What do you want to do in ${currentLoc.name}?</p>
      </div>
    `;

    buttonsContainer.innerHTML = '';

    // Use theme-specific money-making activities if available
    if (this.theme.moneyMaking && this.theme.moneyMaking.activities) {
      this.theme.moneyMaking.activities.forEach(activity => {
        const btn = document.createElement('button');
        btn.textContent = `${activity.icon} ${activity.name}`;
        btn.onclick = () => this.doMoneyActivity(activity);
        buttonsContainer.appendChild(btn);
      });
    } else {
      // Fallback to default activities (for NorCal Trail theme)
      // Busk with Guitar (only if has guitar)
      if (this.engine.state.items.guitar) {
        const buskBtn = document.createElement('button');
        buskBtn.textContent = '🎸 Busk with Guitar (1 day, earn $30-60)';
        buskBtn.onclick = () => this.busk();
        buttonsContainer.appendChild(buskBtn);
      }

      // Make & Sell Crafts
      const craftsBtn = document.createElement('button');
      craftsBtn.textContent = '🌼 Make & Sell Crafts (1 day, earn $40-70)';
      craftsBtn.onclick = () => this.sellCrafts();
      buttonsContainer.appendChild(craftsBtn);

      // Odd Jobs
      const jobsBtn = document.createElement('button');
      jobsBtn.textContent = '🔧 Odd Jobs (1 day, earn $80-120)';
      jobsBtn.onclick = () => this.oddJobs();
      buttonsContainer.appendChild(jobsBtn);
    }

    // Cancel
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Never Mind';
    cancelBtn.classList.add('secondary');
    cancelBtn.onclick = () => this.showMainMenu();
    buttonsContainer.appendChild(cancelBtn);
  }

  /**
   * Do theme-specific money-making activity
   */
  doMoneyActivity(activity) {
    const earnings = Math.floor(Math.random() * (activity.earnings.max - activity.earnings.min + 1)) + activity.earnings.min;
    this.engine.state.resources.currency += earnings;
    this.engine.advanceTime(1);

    // Apply effects if any
    if (activity.effects) {
      this.engine.applyEffects(activity.effects);
    }

    const message = activity.message.replace(/\$AMOUNT/g, earnings);
    this.showSimpleEvent(message);
    this.updateUI();
    setTimeout(() => this.checkFailAndShowMenu(), 2500);
  }

  /**
   * Busk with guitar
   */
  busk() {
    if (!this.engine.state.items.guitar) {
      this.showSimpleEvent('You need a guitar to busk, man! Check the general store.');
      setTimeout(() => this.showMakeMoney(), 2000);
      return;
    }

    const currentLoc = this.engine.getCurrentLocation();

    // Check if already busked here
    if (this.engine.state.lastBuskLocation === currentLoc.name) {
      this.showSimpleEvent(
        `<h3 style="color: #ff6b6b;">🚨 Get Outta Here! 🚨</h3>` +
        `<p>The cops recognize you from last time!</p>` +
        `<p>"We told you hippies NO LOITERING! Beat it!"</p>` +
        `<p style="color: #fbbf24; margin-top: 1rem;">You got kicked out. Can't busk in ${currentLoc.name} again!</p>`
      );
      this.updateUI();
      setTimeout(() => this.showMainMenu(), 2500);
      return;
    }

    const earnings = Math.floor(Math.random() * 31) + 30; // $30-60
    this.engine.state.resources.currency += earnings;
    this.engine.state.resources.morale += 15; // Playing music is groovy!
    this.engine.state.resources.food -= 5; // Standing around all day
    this.engine.advanceTime(1);

    // Track where you busked
    this.engine.state.lastBuskLocation = currentLoc.name;

    this.showSimpleEvent(
      `🎸 You spend the day busking on the street corner, playing groovy tunes!<br><br>` +
      `People dig your vibe and drop change in your guitar case!<br><br>` +
      `<span style="color: #fbbf24;">+1 day</span> | ` +
      `<span style="color: #4ade80;">+$${earnings} Cash 💰</span> | ` +
      `<span style="color: #4ade80;">+15 ${this.theme.resources.morale.name} ${this.theme.resources.morale.icon}</span> | ` +
      `<span style="color: #ef4444;">-5 ${this.theme.resources.food.name} ${this.theme.resources.food.icon}</span>`
    );
    this.updateUI();
    setTimeout(() => this.showMainMenu(), 2500);
  }

  /**
   * Make and sell crafts
   */
  sellCrafts() {
    const earnings = Math.floor(Math.random() * 31) + 40; // $40-70
    this.engine.state.resources.currency += earnings;
    this.engine.advanceTime(1);

    this.showSimpleEvent(
      `🌼 You spend the day making friendship bracelets, tie-dye shirts, and peace sign necklaces!<br><br>` +
      `The hippie market loves your crafts! You earned <strong style="color: #4ade80;">$${earnings}</strong>!<br><br>` +
      `<span style="color: #fbbf24;">+1 day</span> | <span style="color: #4ade80;">+$${earnings} Cash 💰</span>`
    );
    this.updateUI();
    setTimeout(() => this.showMainMenu(), 2500);
  }

  /**
   * Do odd jobs
   */
  oddJobs() {
    const earnings = Math.floor(Math.random() * 41) + 80; // $80-120
    this.engine.state.resources.currency += earnings;
    this.engine.advanceTime(1);

    this.showSimpleEvent(
      `🔧 You spend the day doing odd jobs: washing dishes, fixing cars, hauling boxes...<br><br>` +
      `It's not glamorous, but the bread is REAL! You earned <strong style="color: #4ade80;">$${earnings}</strong>!<br><br>` +
      `<span style="color: #fbbf24;">+1 day</span> | <span style="color: #4ade80;">+$${earnings} Cash 💰</span>`
    );
    this.updateUI();
    setTimeout(() => this.showMainMenu(), 2500);
  }

  /**
   * Show gas station for purchasing fuel
   */
  showGasStation() {
    const eventContainer = document.getElementById('eventContainer');
    const buttonsContainer = document.getElementById('actionButtons');

    const currentFuel = this.engine.state.resources.fuel;
    const maxFuel = this.theme.resources.fuel.max;
    const spaceLeft = maxFuel - currentFuel;
    const currentCash = this.engine.state.resources.currency;

    if (spaceLeft <= 0) {
      this.showSimpleEvent(`Your ${this.theme.resources.fuel.name.toLowerCase()} tank is already full! (${Math.floor(currentFuel)}/${maxFuel})`);
      setTimeout(() => this.showMainMenu(), 1500);
      return;
    }

    eventContainer.innerHTML = `<div class="event-box">
      <h3 style="color: #ff6b6b; margin-bottom: 1rem;">${this.theme.resources.fuel.icon} Gas Station</h3>
      <p>Current ${this.theme.resources.fuel.name.toLowerCase()}: ${Math.floor(currentFuel)}/${maxFuel}</p>
      <p>Your ${this.theme.resources.currency.name.toLowerCase()}: ${this.theme.resources.currency.prefix}${Math.floor(currentCash)}</p>
      <br>
      <p><strong>How much ${this.theme.resources.fuel.name.toLowerCase()} do you want?</strong></p>
    </div>`;

    buttonsContainer.innerHTML = '';

    // Gas purchase options
    const amounts = [
      { amount: 25, cost: 20 },
      { amount: 50, cost: 35 },
      { amount: 75, cost: 50 },
      { amount: 100, cost: 60 }
    ];

    amounts.forEach(option => {
      if (option.amount <= spaceLeft) {
        const btn = document.createElement('button');
        btn.className = 'secondary';
        btn.textContent = `${option.amount} units - ${this.theme.resources.currency.prefix}${option.cost}`;
        btn.onclick = () => this.buyGas(option.amount, option.cost);
        buttonsContainer.appendChild(btn);
      }
    });

    // Always offer "Top Off Tank" option if not full
    if (spaceLeft > 0) {
      const topOffCost = Math.ceil(spaceLeft * 0.65); // ~$0.65 per unit
      const btn = document.createElement('button');
      btn.textContent = `${this.theme.resources.fuel.icon} Top Off Tank (${Math.floor(spaceLeft)} units) - ${this.theme.resources.currency.prefix}${topOffCost}`;
      btn.onclick = () => this.buyGas(spaceLeft, topOffCost);
      buttonsContainer.appendChild(btn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Never mind';
    cancelBtn.onclick = () => this.showMainMenu();
    buttonsContainer.appendChild(cancelBtn);
  }

  /**
   * Purchase gas
   */
  buyGas(amount, cost) {
    if (this.engine.state.resources.currency < cost) {
      this.showSimpleEvent(`Not enough ${this.theme.resources.currency.name.toLowerCase()}!`);
      setTimeout(() => this.showGasStation(), 1500);
      return;
    }

    this.engine.state.resources.fuel = Math.min(
      this.theme.resources.fuel.max,
      this.engine.state.resources.fuel + amount
    );
    this.engine.state.resources.currency -= cost;

    this.showSimpleEvent(`Filled up with ${amount} units of ${this.theme.resources.fuel.name.toLowerCase()}! ${this.theme.resources.fuel.icon}`);
    this.updateUI();
    setTimeout(() => this.showMainMenu(), 1500);
  }

  /**
   * Handle fail conditions
   */
  handleFailCondition(result) {
    const messages = {
      allAbandoned: 'Everyone abandoned the trip. You\'re traveling alone.',
      noFuel: 'Ran out of fuel. Stranded.',
      starved: 'Your party starved.',
      timeExpired: '⏰ TIME\'S UP! The 28-day deadline has passed. Whatever they were planning at Area 51... it already happened. You were too late.'
    };

    if (result.type === 'fail') {
      this.hideAllScreens();
      document.getElementById('gameOverScreen').classList.remove('hidden');
      document.getElementById('gameOverMessage').textContent = messages[result.reason] || 'Game Over';
      this.currentScreen = 'gameOver';
    } else if (result.type === 'moraleAbandonment') {
      this.showSimpleEvent(
        `${this.theme.resources.morale.name} hit zero! ${result.member.name} has abandoned the trip.`
      );
      this.updateUI();
    } else if (result.type === 'paranoiaAbandonment') {
      this.showSimpleEvent(
        `😰 PARANOIA OVERLOAD! ${result.member.name} ${result.member.reason}!<br><br>` +
        `<span style="color: #ff6b6b;">The stress was too much. They're gone.</span>`
      );
      this.updateUI();
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}


