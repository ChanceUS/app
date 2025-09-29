-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  tokens INTEGER DEFAULT 1000,
  total_games_played INTEGER DEFAULT 0,
  total_games_won INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_bet INTEGER NOT NULL,
  max_bet INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  player1_id UUID REFERENCES public.users(id) NOT NULL,
  player2_id UUID REFERENCES public.users(id),
  bet_amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, completed, cancelled
  winner_id UUID REFERENCES public.users(id),
  game_data JSONB, -- Store game-specific data (moves, answers, etc.)
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  match_id UUID REFERENCES public.matches(id),
  type VARCHAR(20) NOT NULL, -- bet, win, loss, bonus
  amount INTEGER NOT NULL, -- positive for credits, negative for debits
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_history table for detailed game records
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- move, answer, timeout, etc.
  action_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matchmaking_queue table for priority matches
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  bet_amount INTEGER NOT NULL,
  match_type VARCHAR(20) NOT NULL, -- 'free', 'tokens', 'cash5', 'cash10'
  priority_match_id UUID REFERENCES public.matches(id), -- Links to the priority match
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'matched', 'expired', 'cancelled'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 3 minutes from creation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create priority_matches table for async matches
CREATE TABLE IF NOT EXISTS public.priority_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_match_id UUID REFERENCES public.matches(id) NOT NULL,
  player1_id UUID REFERENCES public.users(id) NOT NULL,
  player2_id UUID REFERENCES public.users(id),
  player1_result JSONB, -- Store player1's game results
  player2_result JSONB, -- Store player2's game results
  status VARCHAR(20) DEFAULT 'waiting_player2', -- 'waiting_player2', 'completed', 'cancelled'
  winner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for games table (public read)
CREATE POLICY "Anyone can view games" ON public.games
  FOR SELECT USING (is_active = true);

-- Create policies for matches table
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create matches" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can update their own matches" ON public.matches
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Create policies for transactions table
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for match_history table
CREATE POLICY "Users can view match history for their matches" ON public.match_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_history.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create match history for their matches" ON public.match_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_history.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    )
  );

-- Create policies for matchmaking_queue table
CREATE POLICY "Users can view matchmaking queue entries for matching" ON public.matchmaking_queue
  FOR SELECT USING (true); -- Allow all users to see queue entries for matching

CREATE POLICY "Users can create their own matchmaking queue entries" ON public.matchmaking_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matchmaking queue entries" ON public.matchmaking_queue
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for priority_matches table
CREATE POLICY "Users can view priority matches they're part of" ON public.priority_matches
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create priority matches" ON public.priority_matches
  FOR INSERT WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Users can update priority matches they're part of" ON public.priority_matches
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON public.matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON public.matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_history_match ON public.match_history(match_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_game_bet ON public.matchmaking_queue(game_id, bet_amount, match_type);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON public.matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_expires ON public.matchmaking_queue(expires_at);
CREATE INDEX IF NOT EXISTS idx_priority_matches_status ON public.priority_matches(status);
