-- Clean up open matches and expired queues
-- Run this in Supabase SQL Editor

-- 1. First, let's see what we have
SELECT 
  'Waiting Matches' as type,
  COUNT(*) as count
FROM matches 
WHERE status = 'waiting' AND player2_id IS NULL

UNION ALL

SELECT 
  'Expired Queues' as type,
  COUNT(*) as count
FROM matchmaking_queue 
WHERE status = 'waiting' AND expires_at < NOW()

UNION ALL

SELECT 
  'Active Queues' as type,
  COUNT(*) as count
FROM matchmaking_queue 
WHERE status = 'waiting' AND expires_at >= NOW();

-- 2. Clean up expired matchmaking queues (older than 3 minutes)
UPDATE matchmaking_queue 
SET status = 'expired'
WHERE status = 'waiting' 
  AND expires_at < NOW();

-- 3. Clean up old waiting matches (older than 1 hour)
-- First, refund tokens for old matches
WITH old_matches AS (
  SELECT m.id, m.player1_id, m.bet_amount
  FROM matches m
  WHERE m.status = 'waiting' 
    AND m.player2_id IS NULL
    AND m.created_at < NOW() - INTERVAL '1 hour'
)
UPDATE users 
SET tokens = tokens + old_matches.bet_amount
FROM old_matches
WHERE users.id = old_matches.player1_id;

-- 4. Create refund transactions for old matches
WITH old_matches AS (
  SELECT m.id, m.player1_id, m.bet_amount
  FROM matches m
  WHERE m.status = 'waiting' 
    AND m.player2_id IS NULL
    AND m.created_at < NOW() - INTERVAL '1 hour'
)
INSERT INTO transactions (user_id, match_id, amount, type, description)
SELECT 
  player1_id,
  id,
  bet_amount,
  'bonus',
  'Match expired - refund of ' || bet_amount || ' tokens'
FROM old_matches;

-- 5. Cancel old waiting matches
UPDATE matches 
SET status = 'cancelled'
WHERE status = 'waiting' 
  AND player2_id IS NULL
  AND created_at < NOW() - INTERVAL '1 hour';

-- 6. Show final results
SELECT 
  'After Cleanup - Waiting Matches' as type,
  COUNT(*) as count
FROM matches 
WHERE status = 'waiting' AND player2_id IS NULL

UNION ALL

SELECT 
  'After Cleanup - Expired Queues' as type,
  COUNT(*) as count
FROM matchmaking_queue 
WHERE status = 'expired'

UNION ALL

SELECT 
  'After Cleanup - Active Queues' as type,
  COUNT(*) as count
FROM matchmaking_queue 
WHERE status = 'waiting' AND expires_at >= NOW();

-- 7. Show any remaining issues
SELECT 
  'Remaining Issues' as type,
  COUNT(*) as count
FROM matches 
WHERE status = 'waiting' AND player2_id IS NULL
  AND created_at < NOW() - INTERVAL '30 minutes';
