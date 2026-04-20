-- Advanced Analytics Dashboard Schema

-- Create user_statistics table for aggregated player stats
CREATE TABLE IF NOT EXISTS public.user_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  total_tokens_won INTEGER DEFAULT 0,
  total_tokens_lost INTEGER DEFAULT 0,
  average_match_duration INTEGER DEFAULT 0, -- in seconds
  longest_win_streak INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  games_played_by_type JSONB DEFAULT '{}', -- {game_id: count}
  wins_by_game_type JSONB DEFAULT '{}', -- {game_id: count}
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_statistics table for per-match detailed stats
CREATE TABLE IF NOT EXISTS public.match_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  player1_stats JSONB, -- {score, moves, time_taken, etc.}
  player2_stats JSONB,
  match_duration INTEGER, -- in seconds
  total_moves INTEGER,
  game_specific_stats JSONB, -- Game-specific metrics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard_cache table for performance
CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_type VARCHAR(50) NOT NULL, -- 'overall', 'game_id', 'daily', 'weekly', 'monthly'
  game_id UUID REFERENCES public.games(id), -- NULL for overall
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  rankings JSONB NOT NULL, -- Array of {user_id, rank, score, etc.}
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(leaderboard_type, game_id, period_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_statistics_user ON public.user_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_match_statistics_match ON public.match_statistics(match_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_type ON public.leaderboard_cache(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_expires ON public.leaderboard_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Policies for user_statistics
CREATE POLICY "Users can view their own statistics" ON public.user_statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public leaderboard statistics" ON public.user_statistics
  FOR SELECT USING (true); -- Public for leaderboards

-- Policies for match_statistics
CREATE POLICY "Users can view statistics for their matches" ON public.match_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_statistics.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    )
  );

-- Policies for leaderboard_cache
CREATE POLICY "Anyone can view leaderboard cache" ON public.leaderboard_cache
  FOR SELECT USING (expires_at > NOW());

-- Function to update user statistics when a match completes
CREATE OR REPLACE FUNCTION update_user_statistics_on_match_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update player1 stats
    INSERT INTO public.user_statistics (user_id, total_matches, total_wins, total_losses, win_rate, last_updated)
    VALUES (
      NEW.player1_id,
      1,
      CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
      CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
      CASE WHEN NEW.winner_id = NEW.player1_id THEN 100.00 ELSE 0.00 END,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_matches = user_statistics.total_matches + 1,
      total_wins = user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
      total_losses = user_statistics.total_losses + CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
      win_rate = CASE 
        WHEN user_statistics.total_matches + 1 > 0 
        THEN (user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END)::DECIMAL / (user_statistics.total_matches + 1) * 100
        ELSE 0.00
      END,
      last_updated = NOW();

    -- Update player2 stats if player2 exists
    IF NEW.player2_id IS NOT NULL THEN
      INSERT INTO public.user_statistics (user_id, total_matches, total_wins, total_losses, win_rate, last_updated)
      VALUES (
        NEW.player2_id,
        1,
        CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
        CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
        CASE WHEN NEW.winner_id = NEW.player2_id THEN 100.00 ELSE 0.00 END,
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        total_matches = user_statistics.total_matches + 1,
        total_wins = user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
        total_losses = user_statistics.total_losses + CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
        win_rate = CASE 
          WHEN user_statistics.total_matches + 1 > 0 
          THEN (user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END)::DECIMAL / (user_statistics.total_matches + 1) * 100
          ELSE 0.00
        END,
        last_updated = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_user_statistics ON public.matches;
CREATE TRIGGER trigger_update_user_statistics
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION update_user_statistics_on_match_complete();

