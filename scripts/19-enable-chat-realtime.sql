-- Enable Realtime for messages table
-- This allows real-time chat updates

-- Enable Realtime publication for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

