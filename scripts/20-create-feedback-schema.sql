-- Create feedback table for user feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  feedback_type VARCHAR(20) DEFAULT 'general', -- 'general', 'bug', 'feature', 'improvement'
  page_url TEXT, -- Store the page where feedback was submitted
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'reviewed', 'resolved', 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can submit feedback
CREATE POLICY "Users can submit feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback (if you have an admin role system)
-- For now, allow authenticated users to view all feedback for transparency
CREATE POLICY "Authenticated users can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (true);

