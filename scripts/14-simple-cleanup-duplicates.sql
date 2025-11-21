-- Simple cleanup: Delete duplicate tournament matches
-- Keep only the first (oldest) match for each round/bracket position

-- Step 1: Delete duplicate tournament_matches (keeps the oldest one)
DELETE FROM tournament_matches
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY tournament_id, round_number, bracket_position 
        ORDER BY created_at ASC
      ) as row_num
    FROM tournament_matches
    WHERE tournament_id = '009666b6-1adb-4d14-9df7-cbe36dbe1bd1'
  ) ranked
  WHERE row_num > 1
);

-- Step 2: Verify - this should return 0 rows if cleanup was successful
SELECT 
  round_number,
  bracket_position,
  COUNT(*) as match_count
FROM tournament_matches
WHERE tournament_id = '009666b6-1adb-4d14-9df7-cbe36dbe1bd1'
GROUP BY round_number, bracket_position
HAVING COUNT(*) > 1;

