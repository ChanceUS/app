-- Quick delete: Remove the duplicate match for Round 1, Position 1
-- This keeps the oldest match and deletes the newer duplicate

-- First, let's see what we have
SELECT 
  id,
  match_id,
  round_number,
  bracket_position,
  created_at,
  status
FROM tournament_matches
WHERE tournament_id = '009666b6-1adb-4d14-9df7-cbe36dbe1bd1'
  AND round_number = 1
  AND bracket_position = 1
ORDER BY created_at;

-- Delete the newer duplicate (keep the oldest one)
DELETE FROM tournament_matches
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
    FROM tournament_matches
    WHERE tournament_id = '009666b6-1adb-4d14-9df7-cbe36dbe1bd1'
      AND round_number = 1
      AND bracket_position = 1
  ) ranked
  WHERE row_num > 1  -- Keep first, delete rest
);

-- Verify - should only show 1 match now
SELECT 
  round_number,
  bracket_position,
  COUNT(*) as match_count
FROM tournament_matches
WHERE tournament_id = '009666b6-1adb-4d14-9df7-cbe36dbe1bd1'
GROUP BY round_number, bracket_position;

