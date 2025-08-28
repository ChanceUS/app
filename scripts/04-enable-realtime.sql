-- Enable realtime for matches and match_history tables
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_history;

-- Create a function to handle match updates
CREATE OR REPLACE FUNCTION handle_match_update()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called on match updates
  -- We can add custom logic here if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match update
CREATE TRIGGER match_update_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_match_update();
