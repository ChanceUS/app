-- Add gamertag column to users table
-- This allows users to have a unique gamertag/display name for gaming

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gamertag VARCHAR(50) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_gamertag ON public.users(gamertag);

-- Add comment to explain the field
COMMENT ON COLUMN public.users.gamertag IS 'Unique gamertag/display name chosen by the user for gaming';

