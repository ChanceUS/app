-- Add accepted_at column if it doesn't exist
ALTER TABLE public.friends 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

