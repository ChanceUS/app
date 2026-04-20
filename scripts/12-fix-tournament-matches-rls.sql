-- Fix RLS policies for tournament_matches table
-- Add INSERT policy to allow authenticated users to create tournament match records

-- Drop existing policy if it exists (in case we need to recreate it)
DROP POLICY IF EXISTS "Anyone can view tournament matches" ON public.tournament_matches;

-- Recreate SELECT policy
CREATE POLICY "Anyone can view tournament matches" ON public.tournament_matches
  FOR SELECT USING (true); -- Public for bracket viewing

-- Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create tournament matches" ON public.tournament_matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add UPDATE policy for authenticated users (for status updates)
CREATE POLICY "Authenticated users can update tournament matches" ON public.tournament_matches
  FOR UPDATE USING (auth.uid() IS NOT NULL);

