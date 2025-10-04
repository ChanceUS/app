-- Insert default games
INSERT INTO public.games (name, description, min_bet, max_bet) VALUES
('Math Blitz', 'Fast-paced arithmetic challenges. Solve math problems quickly to win!', 10, 500),
('4 In a Row', 'Classic strategy game. Get four in a row to win!', 25, 1000),
('Trivia Challenge', 'Test your knowledge across various categories!', 15, 750)
ON CONFLICT DO NOTHING;
