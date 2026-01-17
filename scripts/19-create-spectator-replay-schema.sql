-- Spectator Mode and Replay System Schema

-- Create spectators table for live match viewing
CREATE TABLE IF NOT EXISTS public.spectators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Create replays table for completed match replays
CREATE TABLE IF NOT EXISTS public.replays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  replay_data JSONB NOT NULL, -- Full game state history for replay
  view_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  share_token VARCHAR(100) UNIQUE, -- For shareable replay URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spectators_match ON public.spectators(match_id);
CREATE INDEX IF NOT EXISTS idx_spectators_user ON public.spectators(user_id);
CREATE INDEX IF NOT EXISTS idx_replays_match ON public.replays(match_id);
CREATE INDEX IF NOT EXISTS idx_replays_share_token ON public.replays(share_token);
CREATE INDEX IF NOT EXISTS idx_replays_public ON public.replays(is_public) WHERE is_public = true;

-- Enable Row Level Security
ALTER TABLE public.spectators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replays ENABLE ROW LEVEL SECURITY;

-- Policies for spectators table
CREATE POLICY "Users can view spectators for any match" ON public.spectators
  FOR SELECT USING (true); -- Public for match pages

CREATE POLICY "Users can join as spectators" ON public.spectators
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- User is not a player in the match
    NOT EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = spectators.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    )
  );

CREATE POLICY "Users can leave spectator mode" ON public.spectators
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for replays table
CREATE POLICY "Users can view public replays" ON public.replays
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view replays for their matches" ON public.replays
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = replays.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    )
  );

CREATE POLICY "System can create replays" ON public.replays
  FOR INSERT WITH CHECK (true); -- Will be restricted by server-side logic

CREATE POLICY "Users can update their match replays" ON public.replays
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = replays.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    )
  );

