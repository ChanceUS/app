-- Temporarily disable RLS on bar_staff table to fix infinite recursion
-- This allows you to see your bar games while we fix the policies

-- Disable RLS on bar_staff table
ALTER TABLE public.bar_staff DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on bars table temporarily
ALTER TABLE public.bars DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bar_trivia_sessions table
ALTER TABLE public.bar_trivia_sessions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bar_trivia_participants table
ALTER TABLE public.bar_trivia_participants DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bar_trivia_games table
ALTER TABLE public.bar_trivia_games DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bar_trivia_questions table
ALTER TABLE public.bar_trivia_questions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on bar_drink_rewards table
ALTER TABLE public.bar_drink_rewards DISABLE ROW LEVEL SECURITY;
