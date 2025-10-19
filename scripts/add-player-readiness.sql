-- Add player readiness fields to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS player1_ready BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS player2_ready BOOLEAN DEFAULT FALSE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_matches_player_readiness 
ON public.matches(player1_ready, player2_ready) 
WHERE status = 'waiting';
