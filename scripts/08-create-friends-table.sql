-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure no duplicate friend relationships
  UNIQUE(user_id, friend_id),
  
  -- Prevent users from being friends with themselves
  CHECK(user_id != friend_id)
);

-- Create index for faster friend lookups
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- Enable Row Level Security
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own friend relationships
CREATE POLICY "Users can view their own friend relationships"
  ON public.friends
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policy: Users can create friend requests
CREATE POLICY "Users can create friend requests"
  ON public.friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update friend requests they received
CREATE POLICY "Users can update friend requests they received"
  ON public.friends
  FOR UPDATE
  USING (auth.uid() = friend_id);

-- RLS Policy: Users can delete their own friend relationships
CREATE POLICY "Users can delete their own friend relationships"
  ON public.friends
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

