-- Clear all expired and old matchmaking queue entries
-- This will clean up the 34 records in your matchmaking_queue table

-- First, let's see what we have
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_entries,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_entries,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_entries,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '1 hour' THEN 1 END) as old_entries
FROM matchmaking_queue;

-- Delete all entries older than 1 hour (these are definitely expired)
DELETE FROM matchmaking_queue 
WHERE created_at < NOW() - INTERVAL '1 hour';

-- Delete all entries that are already marked as expired or cancelled
DELETE FROM matchmaking_queue 
WHERE status IN ('expired', 'cancelled');

-- Update any remaining 'waiting' entries that are past their expiration time
UPDATE matchmaking_queue 
SET status = 'expired' 
WHERE status = 'waiting' 
AND expires_at < NOW();

-- Delete the newly expired entries
DELETE FROM matchmaking_queue 
WHERE status = 'expired';

-- Show the final count
SELECT 
  COUNT(*) as remaining_entries,
  COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_entries
FROM matchmaking_queue;
