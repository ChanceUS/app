-- Add UPDATE policy for tournaments table to allow prize pool updates
-- This was missing and preventing prize pool sync from working

-- Drop the policy if it already exists (to avoid errors on re-run)
DROP POLICY IF EXISTS "Authenticated users can update tournaments" ON public.tournaments;

-- Create the UPDATE policy
CREATE POLICY "Authenticated users can update tournaments" ON public.tournaments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

