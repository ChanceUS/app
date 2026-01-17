-- Enhanced Chat Features Schema

-- Add new columns to messages table for enhanced features
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS emoji_reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE, -- For replies
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'; -- For additional data

-- Create message_reactions table for better reaction tracking
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL, -- Emoji character or code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create chat_moderation table for moderation tools
CREATE TABLE IF NOT EXISTS public.chat_moderation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  moderator_id UUID REFERENCES public.users(id) NOT NULL,
  action_type VARCHAR(20) NOT NULL, -- 'delete', 'warn', 'mute', 'ban'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_chat_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.user_chat_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  show_timestamps BOOLEAN DEFAULT true,
  show_read_receipts BOOLEAN DEFAULT true,
  mute_notifications BOOLEAN DEFAULT false,
  blocked_users UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_message ON public.chat_moderation(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_moderator ON public.chat_moderation(moderator_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON public.messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_settings ENABLE ROW LEVEL SECURITY;

-- Policies for message_reactions
CREATE POLICY "Users can view reactions" ON public.message_reactions
  FOR SELECT USING (true); -- Public for viewing

CREATE POLICY "Users can add reactions" ON public.message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for chat_moderation (admin/moderator only - will be enforced server-side)
CREATE POLICY "Users can view moderation actions" ON public.chat_moderation
  FOR SELECT USING (true); -- Public for transparency

CREATE POLICY "Moderators can create moderation actions" ON public.chat_moderation
  FOR INSERT WITH CHECK (auth.uid() = moderator_id); -- Server-side will check moderator role

-- Policies for user_chat_settings
CREATE POLICY "Users can view their own chat settings" ON public.user_chat_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat settings" ON public.user_chat_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat settings" ON public.user_chat_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

