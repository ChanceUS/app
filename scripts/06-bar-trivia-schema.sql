-- Bar Trivia System Database Schema
-- This script creates tables for bar venues, QR codes, and venue-specific trivia games

-- Create bars table for venue management
CREATE TABLE IF NOT EXISTS public.bars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  qr_code VARCHAR(50) UNIQUE NOT NULL, -- Unique QR code identifier
  venue_code VARCHAR(10) UNIQUE NOT NULL, -- Short code for manual entry
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bar_staff table for venue management access
CREATE TABLE IF NOT EXISTS public.bar_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES public.bars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'staff', -- 'owner', 'manager', 'staff'
  permissions JSONB DEFAULT '{}', -- Store specific permissions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bar_id, user_id)
);

-- Create bar_trivia_games table for venue-specific trivia sessions
CREATE TABLE IF NOT EXISTS public.bar_trivia_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES public.bars(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  max_questions INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 30, -- seconds
  is_active BOOLEAN DEFAULT true,
  current_high_score INTEGER DEFAULT 0,
  current_high_scorer_id UUID REFERENCES public.users(id),
  current_high_scorer_name VARCHAR(100),
  total_players INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bar_trivia_sessions table for individual game sessions
CREATE TABLE IF NOT EXISTS public.bar_trivia_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES public.bars(id) ON DELETE CASCADE NOT NULL,
  trivia_game_id UUID REFERENCES public.bar_trivia_games(id) ON DELETE CASCADE NOT NULL,
  session_code VARCHAR(20) UNIQUE NOT NULL, -- Short code for joining session
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  total_players INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bar_trivia_participants table for session participants
CREATE TABLE IF NOT EXISTS public.bar_trivia_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.bar_trivia_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  average_response_time DECIMAL(5,2) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, user_id)
);

-- Create bar_trivia_questions table for session-specific questions
CREATE TABLE IF NOT EXISTS public.bar_trivia_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.bar_trivia_sessions(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct answer
  category VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  points INTEGER DEFAULT 10,
  time_limit INTEGER DEFAULT 30,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bar_trivia_answers table for participant answers
CREATE TABLE IF NOT EXISTS public.bar_trivia_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.bar_trivia_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.bar_trivia_participants(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.bar_trivia_questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer INTEGER NOT NULL, -- Index of selected answer
  is_correct BOOLEAN NOT NULL,
  response_time DECIMAL(5,2) NOT NULL, -- Time in seconds
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_id, question_id)
);

-- Create bar_drink_rewards table for tracking drink rewards
CREATE TABLE IF NOT EXISTS public.bar_drink_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES public.bars(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.bar_trivia_participants(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.bar_trivia_sessions(id) ON DELETE CASCADE NOT NULL,
  reward_type VARCHAR(50) NOT NULL, -- 'high_score', 'perfect_score', 'first_place', etc.
  reward_description TEXT NOT NULL,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by_staff_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_trivia_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_trivia_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_trivia_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_trivia_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_drink_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for bars table
CREATE POLICY "Anyone can view active bars" ON public.bars
  FOR SELECT USING (is_active = true);

CREATE POLICY "Bar staff can view their bars" ON public.bars
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_staff 
      WHERE bar_staff.bar_id = bars.id 
      AND bar_staff.user_id = auth.uid() 
      AND bar_staff.is_active = true
    )
  );

CREATE POLICY "Bar staff can update their bars" ON public.bars
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bar_staff 
      WHERE bar_staff.bar_id = bars.id 
      AND bar_staff.user_id = auth.uid() 
      AND bar_staff.is_active = true
    )
  );

-- Create policies for bar_staff table
CREATE POLICY "Users can view bar staff for their bars" ON public.bar_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_staff bs 
      WHERE bs.bar_id = bar_staff.bar_id 
      AND bs.user_id = auth.uid() 
      AND bs.is_active = true
    )
  );

CREATE POLICY "Bar owners can manage staff" ON public.bar_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bar_staff bs 
      WHERE bs.bar_id = bar_staff.bar_id 
      AND bs.user_id = auth.uid() 
      AND bs.role IN ('owner', 'manager')
      AND bs.is_active = true
    )
  );

-- Create policies for bar_trivia_games table
CREATE POLICY "Anyone can view active trivia games" ON public.bar_trivia_games
  FOR SELECT USING (is_active = true);

CREATE POLICY "Bar staff can manage their trivia games" ON public.bar_trivia_games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bar_staff 
      WHERE bar_staff.bar_id = bar_trivia_games.bar_id 
      AND bar_staff.user_id = auth.uid() 
      AND bar_staff.is_active = true
    )
  );

-- Create policies for bar_trivia_sessions table
CREATE POLICY "Anyone can view active sessions" ON public.bar_trivia_sessions
  FOR SELECT USING (status IN ('waiting', 'active'));

CREATE POLICY "Bar staff can manage sessions" ON public.bar_trivia_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bar_staff 
      WHERE bar_staff.bar_id = bar_trivia_sessions.bar_id 
      AND bar_staff.user_id = auth.uid() 
      AND bar_staff.is_active = true
    )
  );

-- Create policies for bar_trivia_participants table
CREATE POLICY "Users can view their own participation" ON public.bar_trivia_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join sessions" ON public.bar_trivia_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON public.bar_trivia_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Bar staff can view all participants" ON public.bar_trivia_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_sessions bts
      JOIN public.bar_staff bs ON bs.bar_id = bts.bar_id
      WHERE bts.id = bar_trivia_participants.session_id
      AND bs.user_id = auth.uid()
      AND bs.is_active = true
    )
  );

-- Create policies for bar_trivia_questions table
CREATE POLICY "Anyone can view questions for active sessions" ON public.bar_trivia_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_sessions 
      WHERE bar_trivia_sessions.id = bar_trivia_questions.session_id 
      AND bar_trivia_sessions.status IN ('active', 'completed')
    )
  );

CREATE POLICY "Bar staff can manage questions" ON public.bar_trivia_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_sessions bts
      JOIN public.bar_staff bs ON bs.bar_id = bts.bar_id
      WHERE bts.id = bar_trivia_questions.session_id
      AND bs.user_id = auth.uid()
      AND bs.is_active = true
    )
  );

-- Create policies for bar_trivia_answers table
CREATE POLICY "Users can view their own answers" ON public.bar_trivia_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_participants 
      WHERE bar_trivia_participants.id = bar_trivia_answers.participant_id 
      AND bar_trivia_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit answers" ON public.bar_trivia_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_participants 
      WHERE bar_trivia_participants.id = bar_trivia_answers.participant_id 
      AND bar_trivia_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Bar staff can view all answers" ON public.bar_trivia_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_sessions bts
      JOIN public.bar_staff bs ON bs.bar_id = bts.bar_id
      WHERE bts.id = bar_trivia_answers.session_id
      AND bs.user_id = auth.uid()
      AND bs.is_active = true
    )
  );

-- Create policies for bar_drink_rewards table
CREATE POLICY "Users can view their own rewards" ON public.bar_drink_rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bar_trivia_participants 
      WHERE bar_trivia_participants.id = bar_drink_rewards.participant_id 
      AND bar_trivia_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Bar staff can manage rewards" ON public.bar_drink_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bar_staff 
      WHERE bar_staff.bar_id = bar_drink_rewards.bar_id 
      AND bar_staff.user_id = auth.uid() 
      AND bar_staff.is_active = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bars_qr_code ON public.bars(qr_code);
CREATE INDEX IF NOT EXISTS idx_bars_venue_code ON public.bars(venue_code);
CREATE INDEX IF NOT EXISTS idx_bars_city_state ON public.bars(city, state);
CREATE INDEX IF NOT EXISTS idx_bar_staff_bar_user ON public.bar_staff(bar_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_games_bar ON public.bar_trivia_games(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_sessions_bar ON public.bar_trivia_sessions(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_sessions_code ON public.bar_trivia_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_participants_session ON public.bar_trivia_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_participants_user ON public.bar_trivia_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_questions_session ON public.bar_trivia_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_answers_participant ON public.bar_trivia_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_bar_trivia_answers_session ON public.bar_trivia_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_bar_drink_rewards_bar ON public.bar_drink_rewards(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_drink_rewards_participant ON public.bar_drink_rewards(participant_id);

-- Create functions for bar trivia system

-- Function to generate unique QR codes
CREATE OR REPLACE FUNCTION generate_bar_qr_code()
RETURNS TEXT AS $$
DECLARE
  qr_code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    qr_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_count FROM public.bars WHERE bars.qr_code = qr_code;
    
    -- If it doesn't exist, we can use it
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN qr_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique venue codes
CREATE OR REPLACE FUNCTION generate_bar_venue_code()
RETURNS TEXT AS $$
DECLARE
  venue_code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a 4-character alphanumeric code
    venue_code := upper(substring(md5(random()::text) from 1 for 4));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_count FROM public.bars WHERE bars.venue_code = venue_code;
    
    -- If it doesn't exist, we can use it
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN venue_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate session codes
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  session_code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    session_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_count FROM public.bar_trivia_sessions WHERE bar_trivia_sessions.session_code = session_code;
    
    -- If it doesn't exist, we can use it
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN session_code;
END;
$$ LANGUAGE plpgsql;

-- Function to update high score when a participant finishes
CREATE OR REPLACE FUNCTION update_bar_trivia_high_score()
RETURNS TRIGGER AS $$
DECLARE
  current_high_score INTEGER;
  current_high_scorer_id UUID;
  current_high_scorer_name VARCHAR(100);
BEGIN
  -- Only process if the participant finished
  IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
    -- Get current high score for this trivia game
    SELECT 
      btg.current_high_score,
      btg.current_high_scorer_id,
      btg.current_high_scorer_name
    INTO 
      current_high_score,
      current_high_scorer_id,
      current_high_scorer_name
    FROM public.bar_trivia_sessions bts
    JOIN public.bar_trivia_games btg ON btg.id = bts.trivia_game_id
    WHERE bts.id = NEW.session_id;
    
    -- If this score is higher, update the high score
    IF NEW.score > current_high_score THEN
      UPDATE public.bar_trivia_games
      SET 
        current_high_score = NEW.score,
        current_high_scorer_id = NEW.user_id,
        current_high_scorer_name = NEW.display_name,
        updated_at = NOW()
      WHERE id = (
        SELECT btg.id 
        FROM public.bar_trivia_sessions bts
        JOIN public.bar_trivia_games btg ON btg.id = bts.trivia_game_id
        WHERE bts.id = NEW.session_id
      );
      
      -- Create a drink reward for beating the high score
      INSERT INTO public.bar_drink_rewards (
        bar_id,
        participant_id,
        session_id,
        reward_type,
        reward_description,
        is_claimed
      ) VALUES (
        (SELECT bts.bar_id FROM public.bar_trivia_sessions bts WHERE bts.id = NEW.session_id),
        NEW.id,
        NEW.session_id,
        'high_score',
        'Congratulations! You beat the high score and earned a free drink!',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update high scores
CREATE TRIGGER trigger_update_bar_trivia_high_score
  AFTER UPDATE ON public.bar_trivia_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_bar_trivia_high_score();

-- Function to calculate participant statistics
CREATE OR REPLACE FUNCTION calculate_participant_stats(participant_uuid UUID)
RETURNS TABLE (
  total_sessions INTEGER,
  total_questions_answered INTEGER,
  total_correct_answers INTEGER,
  average_score DECIMAL(5,2),
  best_score INTEGER,
  accuracy_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT btp.session_id)::INTEGER as total_sessions,
    SUM(btp.questions_answered)::INTEGER as total_questions_answered,
    SUM(btp.correct_answers)::INTEGER as total_correct_answers,
    ROUND(AVG(btp.score), 2) as average_score,
    MAX(btp.score)::INTEGER as best_score,
    ROUND(
      CASE 
        WHEN SUM(btp.questions_answered) > 0 
        THEN (SUM(btp.correct_answers)::DECIMAL / SUM(btp.questions_answered)) * 100
        ELSE 0
      END, 2
    ) as accuracy_percentage
  FROM public.bar_trivia_participants btp
  WHERE btp.user_id = participant_uuid
  AND btp.finished_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
