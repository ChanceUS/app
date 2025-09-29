-- Clear all active matches and queues
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what active matches exist
SELECT 
  id, 
  status, 
  bet_amount, 
  player1_id, 
  player2_id, 
  created_at 
FROM matches 
WHERE status IN ('waiting', 'in_progress')
ORDER BY created_at DESC;

-- 2. Cancel all active matches
UPDATE matches 
SET status = 'cancelled' 
WHERE status IN ('waiting', 'in_progress');

-- 3. Check what matchmaking queues exist
SELECT 
  id, 
  user_id, 
  game_id, 
  status, 
  created_at 
FROM matchmaking_queue 
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- 4. Cancel all waiting matchmaking queues
UPDATE matchmaking_queue 
SET status = 'cancelled' 
WHERE status = 'waiting';

-- 5. Verify everything is cleared
SELECT 'Active matches after cleanup:' as info;
SELECT COUNT(*) as active_matches 
FROM matches 
WHERE status IN ('waiting', 'in_progress');

SELECT 'Waiting queues after cleanup:' as info;
SELECT COUNT(*) as waiting_queues 
FROM matchmaking_queue 
WHERE status = 'waiting';
