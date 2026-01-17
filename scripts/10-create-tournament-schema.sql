-- Tournament System Schema
-- Single elimination tournament with 100 players

-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 100,
  entry_fee INTEGER NOT NULL, -- Token entry fee
  prize_pool INTEGER DEFAULT 0, -- Total prize pool (entry_fee * participants)
  status VARCHAR(20) DEFAULT 'registration', -- 'registration', 'brackets_generated', 'in_progress', 'completed', 'cancelled'
  current_round INTEGER DEFAULT 0, -- 0 = registration, 1+ = round number
  total_rounds INTEGER DEFAULT 0, -- Calculated based on max_participants
  winner_id UUID REFERENCES public.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  bracket_position INTEGER, -- Position in bracket (1-100)
  round_eliminated INTEGER, -- Round number where eliminated (NULL if still active)
  final_rank INTEGER, -- Final ranking (1 = winner, 2 = runner-up, etc.)
  status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'active', 'eliminated', 'withdrawn'
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Create tournament_matches table
-- Links tournament matches to regular matches table
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES public.matches(id) NOT NULL,
  round_number INTEGER NOT NULL, -- Round number (1, 2, 3, etc.)
  bracket_position INTEGER NOT NULL, -- Position in bracket for this round
  player1_bracket_position INTEGER, -- Original bracket position of player1
  player2_bracket_position INTEGER, -- Original bracket position of player2 (NULL for byes)
  winner_bracket_position INTEGER, -- Bracket position of winner (for next round)
  is_bye BOOLEAN DEFAULT false, -- True if this is a bye (automatic advancement)
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, match_id)
);

-- Enable Row Level Security
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for tournaments table
CREATE POLICY "Anyone can view active tournaments" ON public.tournaments
  FOR SELECT USING (status != 'cancelled');

CREATE POLICY "Authenticated users can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tournaments" ON public.tournaments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create policies for tournament_participants table
CREATE POLICY "Users can view tournament participants" ON public.tournament_participants
  FOR SELECT USING (true); -- Public for bracket viewing

CREATE POLICY "Users can register for tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tournament status" ON public.tournament_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for tournament_matches table
CREATE POLICY "Anyone can view tournament matches" ON public.tournament_matches
  FOR SELECT USING (true); -- Public for bracket viewing

CREATE POLICY "Authenticated users can create tournament matches" ON public.tournament_matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tournament matches" ON public.tournament_matches
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON public.tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON public.tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_status ON public.tournament_participants(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON public.tournament_matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_match ON public.tournament_matches(match_id);

