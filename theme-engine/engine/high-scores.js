/**
 * High Score System with Supabase Backend
 *
 * Manages high scores and analytics for all themes
 * Uses Supabase for real-time leaderboards and analytics
 */

class HighScoreManager {
  constructor() {
    // Store config for lazy initialization
    this.SUPABASE_URL = 'https://pusahwnnzjmfpxzadlng.supabase.co';
    this.SUPABASE_ANON_KEY = 'sb_publishable_5i-0Hx0or7TT0ifnttS5tg_GrtDceam';
    this.supabase = null;

    // Generate session ID for analytics
    this.sessionId = this.generateSessionId();
    this.sessionStarted = false;
  }

  // Initialize Supabase client on first use
  initSupabase() {
    if (this.supabase) return this.supabase;

    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
    }
    return this.supabase;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate browser fingerprint for unique player tracking
   * Uses browser characteristics (not 100% accurate but good enough)
   */
  generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Track game session start
   */
  async trackSessionStart(themeName) {
    if (this.sessionStarted) return; // Prevent duplicate tracking

    const supabase = this.initSupabase();
    if (!supabase) return;

    try {
      const fingerprint = this.generateFingerprint();

      const { error } = await supabase
        .from('game_sessions')
        .insert({
          session_id: this.sessionId,
          theme_name: themeName,
          started_at: new Date().toISOString(),
          player_fingerprint: fingerprint
        });

      if (error) {
        console.error('Error tracking session start:', error);
      } else {
        this.sessionStarted = true;
      }
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  }

  /**
   * Add a new score
   */
  async addScore(themeName, playerName, score, details = {}) {
    const supabase = this.initSupabase();
    if (!supabase) {
      console.error('Cannot save score: Supabase not initialized');
      return { madeTopTen: false, rank: -1 };
    }

    if (!playerName || playerName.trim() === '') {
      playerName = 'Anonymous';
    }

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('high_scores')
        .insert({
          theme_name: themeName,
          player_name: playerName.trim(),
          score: score,
          distance: details.distance || 0,
          days: details.days || 0,
          profession: details.profession || 'Unknown',
          survived: details.survived || 0,
          failed: details.failed || false
        })
        .select();

      if (error) {
        console.error('Error saving score:', error);
        return { madeTopTen: false, rank: -1 };
      }

      // Update session with completion
      await supabase
        .from('game_sessions')
        .update({
          completed_at: new Date().toISOString(),
          outcome: details.failed ? 'loss' : 'win',
          final_score: score,
          player_name: playerName.trim()
        })
        .eq('session_id', this.sessionId);

      // Get rank (check position in top 10)
      const { data: rankings, error: rankError } = await supabase
        .from('high_scores')
        .select('score')
        .eq('theme_name', themeName)
        .order('score', { ascending: false })
        .limit(10);

      if (rankError) {
        console.error('Error getting rank:', rankError);
        return { madeTopTen: false, rank: -1 };
      }

      const rank = rankings.findIndex(r => r.score <= score) + 1;

      return {
        madeTopTen: rank > 0 && rank <= 10,
        rank: rank || (rankings.length + 1)
      };
    } catch (error) {
      console.error('Unexpected error saving score:', error);
      return { madeTopTen: false, rank: -1 };
    }
  }

  /**
   * Get high scores for a specific theme
   */
  async getScoresForTheme(themeName) {
    const supabase = this.initSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('high_scores')
        .select('*')
        .eq('theme_name', themeName)
        .order('score', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching scores:', error);
        return [];
      }

      return data.map(score => ({
        playerName: score.player_name,
        score: score.score,
        date: score.created_at,
        distance: score.distance,
        days: score.days,
        profession: score.profession,
        survived: score.survived
      }));
    } catch (error) {
      console.error('Unexpected error fetching scores:', error);
      return [];
    }
  }

  /**
   * Get all themes that have scores
   */
  async getThemesWithScores() {
    const supabase = this.initSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('high_scores')
        .select('theme_name');

      if (error) {
        console.error('Error fetching themes:', error);
        return [];
      }

      // Get unique theme names
      return [...new Set(data.map(d => d.theme_name))];
    } catch (error) {
      console.error('Unexpected error fetching themes:', error);
      return [];
    }
  }

  /**
   * Clear all high scores (admin function)
   */
  async clearAllScores() {
    const supabase = this.initSupabase();
    if (!supabase) {
      alert('Failed to clear scores. Supabase not initialized.');
      return;
    }

    try {
      const { error } = await supabase
        .from('high_scores')
        .delete()
        .neq('id', 0); // Delete all records

      if (error) {
        console.error('Error clearing scores:', error);
        alert('Failed to clear scores. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error clearing scores:', error);
      alert('Failed to clear scores. Please try again.');
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics() {
    const supabase = this.initSupabase();
    if (!supabase) {
      return {
        totalGames: 0,
        completedGames: 0,
        uniquePlayers: 0,
        uniquePlayersByName: 0,
        completionRate: '0.0',
        gamesByTheme: {}
      };
    }

    try {
      // Total games played
      const { count: totalGames } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true });

      // Completed games
      const { count: completedGames } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null);

      // Unique players by fingerprint (more accurate than names)
      const { data: fingerprints } = await supabase
        .from('game_sessions')
        .select('player_fingerprint')
        .not('player_fingerprint', 'is', null);

      const uniqueFingerprints = new Set(fingerprints.map(p => p.player_fingerprint)).size;

      // Also count unique names for comparison
      const { data: names } = await supabase
        .from('game_sessions')
        .select('player_name')
        .not('player_name', 'is', null);

      const uniqueNames = new Set(names.map(p => p.player_name)).size;

      // Games by theme
      const { data: byTheme } = await supabase
        .from('game_sessions')
        .select('theme_name')
        .not('completed_at', 'is', null);

      const themeCounts = {};
      byTheme.forEach(g => {
        themeCounts[g.theme_name] = (themeCounts[g.theme_name] || 0) + 1;
      });

      return {
        totalGames: totalGames || 0,
        completedGames: completedGames || 0,
        uniquePlayers: uniqueFingerprints, // Use fingerprints for true unique count
        uniquePlayersByName: uniqueNames, // Also track by name
        completionRate: totalGames > 0 ? ((completedGames / totalGames) * 100).toFixed(1) : '0.0',
        gamesByTheme: themeCounts
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        totalGames: 0,
        completedGames: 0,
        uniquePlayers: 0,
        uniquePlayersByName: 0,
        completionRate: '0.0',
        gamesByTheme: {}
      };
    }
  }

  /**
   * Calculate score based on game state
   */
  calculateScore(gameState, theme) {
    let score = 0;

    // Base score: Distance traveled
    score += gameState.distance;

    // Bonus: Surviving resources
    score += gameState.resources.fuel * 2;
    score += gameState.resources.morale * 3;
    score += Math.max(0, gameState.resources.currency) * 0.5;

    // Bonus: Party members still with you
    const survivingMembers = gameState.party.filter(m => !m.abandoned).length;
    score += survivingMembers * 500;

    // Mystery theme bonuses
    if (theme.mystery && theme.mystery.enabled) {
      // Evidence bonus (food = evidence in mystery themes like Roswell)
      score += gameState.resources.food * 10;

      // Time bonus
      const daysLeft = theme.mystery.timeLimit - gameState.day;
      if (daysLeft > 0) {
        score += daysLeft * (theme.mystery.bonusPointsPerDay || 50);
      }

      // Low paranoia bonus (if specialItem is paranoia)
      if (theme.resources.specialItem.name === 'Paranoia') {
        const paranoiaBonus = Math.max(0, 100 - gameState.resources.specialItem) * 5;
        score += paranoiaBonus;
      }
    }

    // Profession multiplier
    score *= (gameState.scoreMultiplier || 1.0);

    return Math.floor(score);
  }

  /**
   * Format score for display
   */
  formatScore(score) {
    return score.toLocaleString();
  }

  /**
   * Format date for display
   */
  formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// Global instance
const highScoreManager = new HighScoreManager();

// Export for use in browser or Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HighScoreManager;
}
