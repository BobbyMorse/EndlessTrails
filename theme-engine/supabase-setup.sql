-- Endless Trails - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- High Scores Table
-- ============================================
CREATE TABLE IF NOT EXISTS high_scores (
  id BIGSERIAL PRIMARY KEY,
  theme_name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  distance INTEGER DEFAULT 0,
  days INTEGER DEFAULT 0,
  profession TEXT,
  survived INTEGER DEFAULT 0,
  failed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_high_scores_theme_score
  ON high_scores(theme_name, score DESC);

-- Create index for player lookups
CREATE INDEX IF NOT EXISTS idx_high_scores_player
  ON high_scores(player_name, created_at DESC);

-- ============================================
-- Game Sessions Table (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  theme_name TEXT NOT NULL,
  player_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  outcome TEXT, -- 'win', 'loss', 'abandoned'
  final_score INTEGER,
  ip_hash TEXT, -- Optional: server-side IP tracking
  player_fingerprint TEXT -- Browser fingerprint for unique player tracking
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_sessions_theme
  ON game_sessions(theme_name, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_completed
  ON game_sessions(completed_at)
  WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_outcome
  ON game_sessions(outcome)
  WHERE outcome IS NOT NULL;

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies - Allow public read/write
-- ============================================

-- High Scores: Anyone can read
CREATE POLICY "Anyone can view high scores"
  ON high_scores
  FOR SELECT
  USING (true);

-- High Scores: Anyone can insert
CREATE POLICY "Anyone can insert high scores"
  ON high_scores
  FOR INSERT
  WITH CHECK (true);

-- High Scores: Allow delete (for admin/clear function)
CREATE POLICY "Anyone can delete high scores"
  ON high_scores
  FOR DELETE
  USING (true);

-- Game Sessions: Anyone can read
CREATE POLICY "Anyone can view sessions"
  ON game_sessions
  FOR SELECT
  USING (true);

-- Game Sessions: Anyone can insert
CREATE POLICY "Anyone can insert sessions"
  ON game_sessions
  FOR INSERT
  WITH CHECK (true);

-- Game Sessions: Anyone can update their own session
CREATE POLICY "Anyone can update sessions"
  ON game_sessions
  FOR UPDATE
  USING (true);

-- ============================================
-- Helpful Views for Analytics
-- ============================================

-- View: Leaderboard by theme
CREATE OR REPLACE VIEW leaderboard_by_theme AS
SELECT
  theme_name,
  player_name,
  score,
  distance,
  days,
  profession,
  survived,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY theme_name ORDER BY score DESC) as rank
FROM high_scores
ORDER BY theme_name, score DESC;

-- View: Game statistics
CREATE OR REPLACE VIEW game_statistics AS
SELECT
  theme_name,
  COUNT(*) as total_sessions,
  COUNT(completed_at) as completed_sessions,
  COUNT(DISTINCT player_name) as unique_players_by_name,
  COUNT(DISTINCT player_fingerprint) as unique_players_by_device,
  ROUND(AVG(CASE WHEN outcome = 'win' THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate,
  ROUND(AVG(final_score), 0) as avg_score,
  MAX(final_score) as high_score
FROM game_sessions
WHERE completed_at IS NOT NULL
GROUP BY theme_name;

-- ============================================
-- Test Queries (optional - for verification)
-- ============================================

-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('high_scores', 'game_sessions');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('high_scores', 'game_sessions');
