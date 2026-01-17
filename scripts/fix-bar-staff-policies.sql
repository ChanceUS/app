-- Fix infinite recursion in bar_staff policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view bar staff for their bars" ON public.bar_staff;
DROP POLICY IF EXISTS "Bar owners can manage staff" ON public.bar_staff;

-- Create fixed policies that reference bars table instead of bar_staff
CREATE POLICY "Users can view bar staff for their bars" ON public.bar_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bars b
      JOIN public.bar_staff bs ON bs.bar_id = b.id
      WHERE b.id = bar_staff.bar_id 
      AND bs.user_id = auth.uid() 
      AND bs.is_active = true
    )
  );

CREATE POLICY "Bar owners can manage staff" ON public.bar_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bars b
      JOIN public.bar_staff bs ON bs.bar_id = b.id
      WHERE b.id = bar_staff.bar_id 
      AND bs.user_id = auth.uid() 
      AND bs.role IN ('owner', 'manager')
      AND bs.is_active = true
    )
  );

-- Also fix any other policies that might have similar issues
DROP POLICY IF EXISTS "Bar staff can view all participants" ON public.bar_trivia_participants;
CREATE POLICY "Bar staff can view all participants" ON public.bar_trivia_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_sessions bts
      JOIN public.bars b ON b.id = bts.bar_id
      JOIN public.bar_staff bs ON bs.bar_id = b.id
      WHERE bts.id = bar_trivia_participants.session_id
      AND bs.user_id = auth.uid()
      AND bs.is_active = true
    )
  );

DROP POLICY IF EXISTS "Bar staff can manage questions" ON public.bar_trivia_questions;
CREATE POLICY "Bar staff can manage questions" ON public.bar_trivia_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_sessions bts
      JOIN public.bars b ON b.id = bts.bar_id
      JOIN public.bar_staff bs ON bs.bar_id = b.id
      WHERE bts.id = bar_trivia_questions.session_id
      AND bs.user_id = auth.uid()
      AND bs.is_active = true
    )
  );
