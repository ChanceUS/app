-- Fix: Add SECURITY DEFINER to the trigger function so it can bypass RLS
CREATE OR REPLACE FUNCTION update_user_statistics_on_match_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update player1 stats
    INSERT INTO public.user_statistics (user_id, total_matches, total_wins, total_losses, win_rate, last_updated)
    VALUES (
      NEW.player1_id,
      1,
      CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
      CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
      CASE WHEN NEW.winner_id = NEW.player1_id THEN 100.00 ELSE 0.00 END,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_matches = user_statistics.total_matches + 1,
      total_wins = user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
      total_losses = user_statistics.total_losses + CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
      win_rate = CASE 
        WHEN user_statistics.total_matches + 1 > 0 
        THEN (user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END)::DECIMAL / (user_statistics.total_matches + 1) * 100
        ELSE 0.00
      END,
      last_updated = NOW();

    -- Update player2 stats if player2 exists
    IF NEW.player2_id IS NOT NULL THEN
      INSERT INTO public.user_statistics (user_id, total_matches, total_wins, total_losses, win_rate, last_updated)
      VALUES (
        NEW.player2_id,
        1,
        CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
        CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
        CASE WHEN NEW.winner_id = NEW.player2_id THEN 100.00 ELSE 0.00 END,
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        total_matches = user_statistics.total_matches + 1,
        total_wins = user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
        total_losses = user_statistics.total_losses + CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
        win_rate = CASE 
          WHEN user_statistics.total_matches + 1 > 0 
          THEN (user_statistics.total_wins + CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END)::DECIMAL / (user_statistics.total_matches + 1) * 100
          ELSE 0.00
        END,
        last_updated = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

