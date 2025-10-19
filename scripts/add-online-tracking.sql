-- Add online tracking columns to users table
-- Run this in your Supabase SQL Editor

-- Add last_seen timestamp column
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add is_online boolean column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);

-- Update existing users to have a default last_seen
UPDATE users SET last_seen = NOW() WHERE last_seen IS NULL;
