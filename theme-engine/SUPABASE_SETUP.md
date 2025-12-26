# Supabase Backend Setup for Endless Trails

Your game now has a **real-time backend** with Supabase! This enables:
- ✅ Global leaderboards shared across all players
- ✅ Game analytics (total games, unique players, completion rates)
- ✅ Session tracking for each playthrough
- ✅ Auto-scaling to thousands of concurrent users

## Setup Instructions (5 minutes)

### 1. Run the SQL Script in Supabase

1. Go to your Supabase project: https://pusahwnnzjmfpxzadlng.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-setup.sql` and paste it
5. Click **Run** (or press Ctrl+Enter)

You should see: ✅ Success. No rows returned

### 2. Verify Tables Were Created

In the SQL Editor, run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('high_scores', 'game_sessions');
```

You should see 2 rows:
- `high_scores`
- `game_sessions`

### 3. Test the Integration

1. Open your game in a browser
2. Play through a game (win or lose)
3. Check the **View High Scores** screen - your score should appear!
4. Check Supabase:
   - Go to **Table Editor** → `high_scores` - you should see your score
   - Go to **Table Editor** → `game_sessions` - you should see your session

## What's Been Implemented

### High Scores
- Top 10 scores per theme
- Player name, score, date, profession, distance, etc.
- Real-time updates (scores appear immediately)
- Global leaderboard shared by all players

### Analytics Tracking
Every game session tracks:
- Theme played
- Player name
- Start time
- Completion time
- Outcome (win/loss)
- Final score

### Database Tables

**high_scores**
- `id` - Unique score ID
- `theme_name` - Which theme was played
- `player_name` - Player's name
- `score` - Final score
- `distance` - Miles traveled
- `days` - Days elapsed
- `profession` - Chosen profession
- `survived` - Party members who made it
- `failed` - Whether they won or lost
- `created_at` - Timestamp

**game_sessions**
- `id` - Unique session ID
- `session_id` - Browser session identifier
- `theme_name` - Which theme
- `player_name` - Player name
- `started_at` - When game started
- `completed_at` - When game finished (NULL if abandoned)
- `outcome` - 'win', 'loss', or NULL
- `final_score` - Score achieved

## View Analytics

You can query analytics directly in Supabase SQL Editor:

### Total Games Played
```sql
SELECT COUNT(*) as total_games
FROM game_sessions;
```

### Completed Games
```sql
SELECT COUNT(*) as completed
FROM game_sessions
WHERE completed_at IS NOT NULL;
```

### Unique Players
```sql
SELECT COUNT(DISTINCT player_name) as unique_players
FROM game_sessions
WHERE player_name IS NOT NULL;
```

### Top Scores Across All Themes
```sql
SELECT
  player_name,
  theme_name,
  score,
  created_at
FROM high_scores
ORDER BY score DESC
LIMIT 20;
```

### Games by Theme
```sql
SELECT
  theme_name,
  COUNT(*) as plays,
  COUNT(CASE WHEN outcome = 'win' THEN 1 END) as wins,
  ROUND(AVG(final_score), 0) as avg_score
FROM game_sessions
WHERE completed_at IS NOT NULL
GROUP BY theme_name
ORDER BY plays DESC;
```

### Win Rate by Theme
```sql
SELECT
  theme_name,
  ROUND(
    COUNT(CASE WHEN outcome = 'win' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    1
  ) as win_rate_percent
FROM game_sessions
WHERE completed_at IS NOT NULL
GROUP BY theme_name;
```

## Advanced: Using the Analytics API

You can also call the analytics function from JavaScript:

```javascript
// Get full analytics
const analytics = await highScoreManager.getAnalytics();

console.log('Total Games:', analytics.totalGames);
console.log('Completion Rate:', analytics.completionRate + '%');
console.log('Unique Players:', analytics.uniquePlayers);
console.log('Games by Theme:', analytics.gamesByTheme);
```

## Scaling & Costs

### Free Tier Includes:
- ✅ 50,000 monthly active users
- ✅ 500 MB database storage
- ✅ 2 GB file storage
- ✅ 50 GB bandwidth
- ✅ Unlimited API requests

This is **more than enough** for hundreds of concurrent players!

### When to Upgrade:
- If you exceed 50k monthly active users
- If you need more than 500 MB database (unlikely - each score is ~200 bytes)
- If you want real-time subscriptions (live updating leaderboards)

## Security

- ✅ Row Level Security (RLS) enabled
- ✅ Public read/write policies (appropriate for a game)
- ✅ API key is safe to expose (it's the "anon" key)
- ✅ No sensitive data stored

**Note:** The API key in the code is the **anonymous key** which is designed to be public. It only has permissions defined by your RLS policies.

## Troubleshooting

### "Failed to load scores"
1. Check browser console for errors
2. Verify Supabase tables exist
3. Check RLS policies are enabled
4. Make sure you're online

### "Session not tracking"
1. Check that `trackSessionStart()` is being called
2. Verify `game_sessions` table exists
3. Check browser console for errors

### Viewing Errors
Open browser console (F12) and look for red error messages starting with "Error".

## Next Steps

Want to add more features? You can:
1. Add user authentication (Supabase Auth)
2. Add player profiles with stats
3. Add achievements/badges
4. Add daily challenges
5. Add real-time multiplayer
6. Add chat/comments on high scores

All of these are built into Supabase!
