-- Cleanup duplicate tournament matches
-- This script finds and deletes duplicate tournament matches for a specific tournament
-- Run this in Supabase SQL Editor

-- Replace this with your tournament ID
DO $$
DECLARE
  tournament_uuid UUID := '009666b6-1adb-4d14-9df7-cbe36dbe1bd1';
  duplicate_count INTEGER;
BEGIN
  -- Find and delete duplicate tournament_matches
  -- Keep the oldest match for each round/bracket_position combination
  WITH duplicates AS (
    SELECT 
      tm.id,
      tm.match_id,
      tm.round_number,
      tm.bracket_position,
      tm.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY tm.tournament_id, tm.round_number, tm.bracket_position 
        ORDER BY tm.created_at ASC
      ) as row_num
    FROM tournament_matches tm
    WHERE tm.tournament_id = tournament_uuid
  )
  DELETE FROM tournament_matches
  WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % duplicate tournament match records', duplicate_count;
  
  -- Delete orphaned matches (matches not referenced by any tournament_match)
  WITH orphaned_matches AS (
    SELECT m.id
    FROM matches m
    WHERE m.id IN (
      SELECT tm.match_id 
      FROM tournament_matches tm 
      WHERE tm.tournament_id = tournament_uuid
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM tournament_matches tm2 
      WHERE tm2.match_id = m.id
    )
  )
  DELETE FROM matches
  WHERE id IN (SELECT id FROM orphaned_matches);
  
  RAISE NOTICE 'Cleanup complete!';
END $$;

-- Verify the cleanup
SELECT 
  round_number,
  bracket_position,
  COUNT(*) as match_count
FROM tournament_matches
WHERE tournament_id = '009666b6-1adb-4d14-9df7-cbe36dbe1bd1'
GROUP BY round_number, bracket_position
HAVING COUNT(*) > 1;

-- If the above query returns no rows, cleanup was successful!

