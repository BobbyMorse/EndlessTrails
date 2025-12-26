/**
 * Mini-Game System - Theme-Configurable Arcade Games
 *
 * Supports different mini-game types that themes can configure:
 * - Foraging (click items before time runs out)
 * - Avoidance (dodge obstacles while moving)
 * - Repair (match parts quickly)
 * - Rhythm (timing-based challenges)
 * - Custom games defined by themes
 */

class MiniGameEngine {
  constructor(theme) {
    this.theme = theme;
    this.currentGame = null;
    this.gameState = {};
  }

  /**
   * Get available mini-games for this theme
   */
  getAvailableGames() {
    return this.theme.miniGames || {};
  }

  /**
   * Start a mini-game by type
   */
  startGame(gameType, onComplete) {
    const gameConfig = this.theme.miniGames[gameType];
    if (!gameConfig) {
      throw new Error(`Mini-game type '${gameType}' not found in theme`);
    }

    this.currentGame = gameType;
    this.onComplete = onComplete;

    // Route to appropriate game handler
    switch (gameConfig.type) {
      case 'foraging':
        return this.startForaging(gameConfig);
      case 'avoidance':
        return this.startAvoidance(gameConfig);
      case 'repair':
        return this.startRepair(gameConfig);
      case 'rhythm':
        return this.startRhythm(gameConfig);
      default:
        throw new Error(`Unknown game type: ${gameConfig.type}`);
    }
  }

  /**
   * FORAGING GAME
   * Click good items, avoid bad items
   */
  startForaging(config) {
    this.gameState = {
      timeLeft: config.duration || 30,
      collected: 0,
      itemsClicked: 0,
      items: [],
      interval: null
    };

    // Render foraging UI
    this.renderForagingUI(config);

    // Spawn items
    this.spawnForagingItems(config);

    // Start timer
    this.gameState.interval = setInterval(() => {
      this.gameState.timeLeft--;
      document.getElementById('forageTimer').textContent = `Time: ${this.gameState.timeLeft}s`;

      if (this.gameState.timeLeft <= 0) {
        this.endForaging(config);
      }
    }, 1000);
  }

  renderForagingUI(config) {
    const container = document.getElementById('miniGameContainer');
    container.innerHTML = `
      <div class="mini-game foraging-game">
        <h2>${config.name}</h2>
        <p>${config.description}</p>
        <div class="timer" id="forageTimer">Time: ${config.duration || 30}s</div>
        <div id="forageCounter">Collected: 0</div>
        <div class="forage-items" id="forageItems"></div>
        <button onclick="miniGame.endForaging()">Stop</button>
      </div>
    `;
  }

  spawnForagingItems(config) {
    const container = document.getElementById('forageItems');
    const items = this.getRegionalItems(config);

    for (let i = 0; i < 12; i++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const div = document.createElement('div');
      div.className = 'forage-item';
      div.textContent = item.icon;
      div.dataset.value = item.value;
      div.dataset.type = item.type;

      div.onclick = () => this.collectForageItem(div, item, config);
      container.appendChild(div);
    }
  }

  getRegionalItems(config) {
    // Combine base items with regional items based on journey phase
    const phase = gameEngine.getCurrentPhase();
    const baseItems = config.items || [];
    const regionalItems = config.regionalItems?.[phase] || [];

    return [...baseItems, ...regionalItems];
  }

  collectForageItem(element, item, config) {
    if (element.classList.contains('clicked')) return;
    element.classList.add('clicked');

    if (item.type === 'instant_fail') {
      // Instant game over (trash bin, poison, etc.)
      this.endForaging(config, true);
    } else if (item.type === 'bad') {
      this.gameState.collected += item.value;
    } else {
      this.gameState.collected += item.value;
    }

    document.getElementById('forageCounter').textContent = `Collected: ${Math.max(0, this.gameState.collected)}`;
  }

  endForaging(config, instantFail = false) {
    clearInterval(this.gameState.interval);

    const result = {
      success: !instantFail && this.gameState.collected > 0,
      score: Math.max(0, this.gameState.collected),
      bonus: {}
    };

    if (instantFail) {
      result.penalty = { food: -10, morale: -15 };
      result.message = config.failMessage || 'Failed! Bad item collected.';
    } else {
      result.bonus.food = result.score;
      result.message = `Collected ${result.score} food!`;
    }

    this.onComplete(result);
  }

  /**
   * AVOIDANCE GAME
   * Dodge obstacles, collect power-ups (like Cosmic River Rapids)
   */
  startAvoidance(config) {
    this.gameState = {
      playerPosition: 250,
      timeLeft: config.duration || 30,
      score: 0,
      hits: 0,
      maxHits: config.maxHits || 3,
      obstacles: [],
      gameInterval: null,
      spawnInterval: null
    };

    this.renderAvoidanceUI(config);
    this.setupAvoidanceControls(config);
    this.startAvoidanceGame(config);
  }

  renderAvoidanceUI(config) {
    const container = document.getElementById('miniGameContainer');
    container.innerHTML = `
      <div class="mini-game avoidance-game">
        <h2>${config.name}</h2>
        <p>${config.description}</p>

        <div class="game-stats">
          <span>⏱️ <span id="avoidanceTime">${config.duration}</span>s</span>
          <span>✨ <span id="avoidanceScore">0</span></span>
          <span>💥 <span id="avoidanceHits">0</span>/${config.maxHits || 3}</span>
        </div>

        <div id="avoidanceGame" class="avoidance-container">
          <div id="avoidancePlayer" class="avoidance-player">
            ${config.playerIcon || '🎮'}
          </div>
        </div>

        <p class="controls-hint">${config.controlsHint || 'Use ← → arrows or tap sides to move'}</p>
      </div>
    `;
  }

  setupAvoidanceControls(config) {
    const gameArea = document.getElementById('avoidanceGame');

    // Keyboard controls
    this.keyHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.gameState.playerPosition = Math.max(50, this.gameState.playerPosition - 40);
        this.updateAvoidancePlayer();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.gameState.playerPosition = Math.min(450, this.gameState.playerPosition + 40);
        this.updateAvoidancePlayer();
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    // Touch controls
    this.touchHandler = (e) => {
      e.preventDefault();
      const rect = gameArea.getBoundingClientRect();
      const clickX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const relativeX = clickX - rect.left;

      if (relativeX < rect.width / 2) {
        this.gameState.playerPosition = Math.max(50, this.gameState.playerPosition - 40);
      } else {
        this.gameState.playerPosition = Math.min(450, this.gameState.playerPosition + 40);
      }
      this.updateAvoidancePlayer();
    };
    gameArea.addEventListener('click', this.touchHandler);
    gameArea.addEventListener('touchstart', this.touchHandler);
  }

  updateAvoidancePlayer() {
    const player = document.getElementById('avoidancePlayer');
    player.style.left = this.gameState.playerPosition + 'px';
  }

  startAvoidanceGame(config) {
    // Spawn obstacles
    this.gameState.spawnInterval = setInterval(() => {
      this.spawnAvoidanceObstacle(config);
    }, config.spawnRate || 800);

    // Game loop
    this.gameState.gameInterval = setInterval(() => {
      this.updateAvoidanceGame(config);
    }, 50);
  }

  spawnAvoidanceObstacle(config) {
    const gameArea = document.getElementById('avoidanceGame');
    const xPosition = Math.floor(Math.random() * 400) + 50;

    const items = [...(config.goodItems || []), ...(config.badItems || [])];
    const item = items[Math.floor(Math.random() * items.length)];

    const obstacle = document.createElement('div');
    obstacle.textContent = item.icon;
    obstacle.className = 'avoidance-obstacle';
    obstacle.style.position = 'absolute';
    obstacle.style.fontSize = '3rem';
    obstacle.style.top = '-50px';
    obstacle.style.left = xPosition + 'px';

    if (item.type === 'good') {
      obstacle.style.textShadow = '0 0 10px #4ade80';
    }

    gameArea.appendChild(obstacle);

    this.gameState.obstacles.push({
      element: obstacle,
      x: xPosition,
      y: -50,
      type: item.type,
      value: item.value,
      collected: false
    });
  }

  updateAvoidanceGame(config) {
    // Update timer
    this.gameState.timeLeft -= 0.05;
    document.getElementById('avoidanceTime').textContent = Math.ceil(this.gameState.timeLeft);

    if (this.gameState.timeLeft <= 0) {
      this.endAvoidance(config);
      return;
    }

    // Move obstacles
    this.gameState.obstacles.forEach((obs, index) => {
      obs.y += 5;
      obs.element.style.top = obs.y + 'px';

      // Check collision
      if (obs.y > 220 && obs.y < 280 && !obs.collected) {
        const distance = Math.abs(obs.x - this.gameState.playerPosition);
        if (distance < 60) {
          obs.collected = true;

          if (obs.type === 'good') {
            this.gameState.score += obs.value;
            document.getElementById('avoidanceScore').textContent = this.gameState.score;
            obs.element.style.animation = 'pulse 0.3s';
            setTimeout(() => obs.element.remove(), 300);
          } else {
            this.gameState.hits++;
            document.getElementById('avoidanceHits').textContent = this.gameState.hits;
            obs.element.style.animation = 'shake 0.3s';

            if (this.gameState.hits >= this.gameState.maxHits) {
              this.endAvoidance(config, true);
            }
          }
        }
      }

      // Remove off-screen obstacles
      if (obs.y > 350) {
        obs.element.remove();
        this.gameState.obstacles.splice(index, 1);
      }
    });
  }

  endAvoidance(config, failed = false) {
    clearInterval(this.gameState.gameInterval);
    clearInterval(this.gameState.spawnInterval);
    document.removeEventListener('keydown', this.keyHandler);

    const gameArea = document.getElementById('avoidanceGame');
    if (this.touchHandler) {
      gameArea.removeEventListener('click', this.touchHandler);
      gameArea.removeEventListener('touchstart', this.touchHandler);
    }

    this.gameState.obstacles.forEach(obs => obs.element.remove());

    const result = {
      success: !failed,
      score: this.gameState.score,
      bonus: {}
    };

    if (failed) {
      result.message = config.failMessage || 'Too many hits! Game over.';
      result.penalty = config.failPenalty || { morale: -20 };
    } else {
      const bonusMultiplier = config.bonusMultiplier || 1;
      result.bonus.morale = Math.floor(this.gameState.score * bonusMultiplier);
      result.message = config.successMessage || `Success! Scored ${this.gameState.score} points!`;
    }

    this.onComplete(result);
  }

  /**
   * REPAIR GAME
   * Match parts quickly
   */
  startRepair(config) {
    this.gameState = {
      timeLeft: config.duration || 20,
      partsMatched: 0,
      partsNeeded: config.partsNeeded || 5,
      currentParts: [],
      interval: null
    };

    this.renderRepairUI(config);
    this.generateRepairParts(config);

    this.gameState.interval = setInterval(() => {
      this.gameState.timeLeft--;
      document.getElementById('repairTimer').textContent = `Time: ${this.gameState.timeLeft}s`;

      if (this.gameState.timeLeft <= 0) {
        this.endRepair(config);
      }
    }, 1000);
  }

  renderRepairUI(config) {
    const container = document.getElementById('miniGameContainer');
    container.innerHTML = `
      <div class="mini-game repair-game">
        <h2>${config.name}</h2>
        <p>${config.description}</p>
        <div class="timer" id="repairTimer">Time: ${config.duration || 20}s</div>
        <div id="repairProgress">Matched: 0/${config.partsNeeded || 5}</div>
        <div id="repairParts" class="repair-grid"></div>
      </div>
    `;
  }

  generateRepairParts(config) {
    const container = document.getElementById('repairParts');
    const parts = config.parts || ['🔧', '🔩', '⚙️', '🔨', '⛽'];

    // Generate pairs
    const allParts = [];
    for (let i = 0; i < config.partsNeeded; i++) {
      const part = parts[i % parts.length];
      allParts.push(part, part);
    }

    // Shuffle
    allParts.sort(() => Math.random() - 0.5);

    // Render
    allParts.forEach((part, index) => {
      const div = document.createElement('div');
      div.className = 'repair-part';
      div.textContent = '❓';
      div.dataset.part = part;
      div.dataset.index = index;
      div.onclick = () => this.clickRepairPart(div, part);
      container.appendChild(div);
    });
  }

  clickRepairPart(element, part) {
    if (element.classList.contains('matched') || element.classList.contains('selected')) return;

    element.classList.add('selected');
    element.textContent = part;

    const selected = document.querySelectorAll('.repair-part.selected');

    if (selected.length === 2) {
      const [first, second] = selected;

      if (first.dataset.part === second.dataset.part) {
        // Match!
        first.classList.remove('selected');
        second.classList.remove('selected');
        first.classList.add('matched');
        second.classList.add('matched');

        this.gameState.partsMatched++;
        document.getElementById('repairProgress').textContent =
          `Matched: ${this.gameState.partsMatched}/${this.gameState.partsNeeded}`;

        if (this.gameState.partsMatched >= this.gameState.partsNeeded) {
          this.endRepair(config, true);
        }
      } else {
        // No match
        setTimeout(() => {
          first.classList.remove('selected');
          second.classList.remove('selected');
          first.textContent = '❓';
          second.textContent = '❓';
        }, 500);
      }
    }
  }

  endRepair(config, success = false) {
    clearInterval(this.gameState.interval);

    const result = {
      success: success || this.gameState.partsMatched >= this.gameState.partsNeeded,
      score: this.gameState.partsMatched,
      bonus: {}
    };

    if (result.success) {
      result.message = config.successMessage || 'Repair complete!';
      result.bonus.morale = 15;
    } else {
      result.message = config.failMessage || 'Repair failed - out of time!';
      result.penalty = config.failPenalty || { currency: -50, morale: -10 };
    }

    this.onComplete(result);
  }

  /**
   * RHYTHM GAME
   * Timing-based button presses
   */
  startRhythm(config) {
    // TODO: Implement rhythm game (future expansion)
    console.log('Rhythm game not yet implemented');
  }

  /**
   * Clean up current game
   */
  cleanup() {
    if (this.gameState.interval) clearInterval(this.gameState.interval);
    if (this.gameState.spawnInterval) clearInterval(this.gameState.spawnInterval);
    if (this.gameState.gameInterval) clearInterval(this.gameState.gameInterval);
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);

    this.currentGame = null;
    this.gameState = {};
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MiniGameEngine;
}
