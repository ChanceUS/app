-- Create chat/messaging system schema
-- Supports: match chat, global chat, DMs, tournament chat

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- 'match', 'global', 'dm', 'tournament'
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE, -- For match chat
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE, -- For tournament chat
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- For DMs
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id) WHERE match_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_tournament ON public.messages(tournament_id) WHERE tournament_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_dm ON public.messages(recipient_id, sender_id) WHERE message_type = 'dm';
CREATE INDEX IF NOT EXISTS idx_messages_global ON public.messages(created_at DESC) WHERE message_type = 'global';
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view match messages for their matches
CREATE POLICY "Users can view match messages"
ON public.messages
FOR SELECT
USING (
  (message_type = 'match' AND match_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
    AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
  ))
  OR
  (message_type = 'global')
  OR
  (message_type = 'dm' AND (sender_id = auth.uid() OR recipient_id = auth.uid()))
  OR
  (message_type = 'tournament' AND tournament_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tournament_participants
    WHERE tournament_participants.tournament_id = messages.tournament_id
    AND tournament_participants.user_id = auth.uid()
  ))
);

-- Policy: Users can send match messages for their matches
CREATE POLICY "Users can send match messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  (
    (message_type = 'match' AND match_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    ))
    OR
    (message_type = 'global')
    OR
    (message_type = 'dm' AND recipient_id IS NOT NULL)
    OR
    (message_type = 'tournament' AND tournament_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.tournament_participants
      WHERE tournament_participants.tournament_id = messages.tournament_id
      AND tournament_participants.user_id = auth.uid()
    ))
  )
);

-- Policy: Users can update their own messages (for read receipts, editing, etc.)
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Policy: Users can mark DMs as read
CREATE POLICY "Users can mark DMs as read"
ON public.messages
FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid());

-- Create a view for unread DM counts per user
CREATE OR REPLACE VIEW public.unread_dm_counts AS
SELECT 
  recipient_id as user_id,
  sender_id,
  COUNT(*) as unread_count
FROM public.messages
WHERE message_type = 'dm' 
  AND is_read = false
  AND recipient_id IS NOT NULL
GROUP BY recipient_id, sender_id;

