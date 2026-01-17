-- Fix match discovery by allowing users to see all waiting matches
-- This is needed so users can discover and join matches created by others

-- Add policy to allow users to view all waiting matches (for discovery)
CREATE POLICY "Users can view all waiting matches for discovery" ON public.matches
  FOR SELECT USING (
    status = 'waiting' 
    AND player2_id IS NULL  -- Only show matches waiting for a second player
  );

-- Add policy to allow users to join matches (update player2_id)
CREATE POLICY "Users can join waiting matches" ON public.matches
  FOR UPDATE USING (
    status = 'waiting' 
    AND player2_id IS NULL  -- Only allow joining matches that are waiting
    AND auth.uid() != player1_id  -- Prevent joining your own match
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'matches' 
ORDER BY policyname;
