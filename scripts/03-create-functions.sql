-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user stats after match completion
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stats when match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update total games played for both players
    UPDATE public.users 
    SET total_games_played = total_games_played + 1,
        updated_at = NOW()
    WHERE id = NEW.player1_id OR id = NEW.player2_id;
    
    -- Update games won for winner
    IF NEW.winner_id IS NOT NULL THEN
      UPDATE public.users 
      SET total_games_won = total_games_won + 1,
          win_rate = CASE 
            WHEN total_games_played + 1 > 0 
            THEN ROUND((total_games_won + 1.0) / (total_games_played + 1) * 100, 2)
            ELSE 0 
          END,
          updated_at = NOW()
      WHERE id = NEW.winner_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user stats when match is completed
DROP TRIGGER IF EXISTS on_match_completed ON public.matches;
CREATE TRIGGER on_match_completed
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- Function to handle token transactions
CREATE OR REPLACE FUNCTION public.process_token_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's token balance
  UPDATE public.users 
  SET tokens = tokens + NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update token balance on transaction
DROP TRIGGER IF EXISTS on_token_transaction ON public.transactions;
CREATE TRIGGER on_token_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.process_token_transaction();
