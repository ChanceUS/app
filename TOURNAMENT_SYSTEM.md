# 🏆 Tournament System Documentation

## Overview

The tournament system allows up to 100 players to compete in a single-elimination bracket tournament across all available games (Math Blitz, Four in a Row, Trivia Challenge).

## Features

- **Single Elimination Bracket**: Players compete head-to-head until one winner remains
- **100 Player Support**: Supports tournaments with up to 100 participants
- **Automatic Bracket Generation**: Brackets are automatically generated when tournament starts
- **Auto-Advancement**: Winners automatically advance to the next round when matches complete
- **Prize Pool**: Entry fees contribute to a prize pool that goes to the winner
- **Real-time Updates**: Tournament brackets update in real-time as matches complete

## Database Schema

### Tables

1. **tournaments**: Main tournament information
   - `id`: Tournament UUID
   - `game_id`: Game being played
   - `name`: Tournament name
   - `max_participants`: Maximum players (default 100)
   - `entry_fee`: Token cost to enter
   - `prize_pool`: Total prize pool (entry_fee × participants)
   - `status`: registration, in_progress, completed, cancelled
   - `current_round`: Current round number (0 = registration)
   - `total_rounds`: Total rounds needed
   - `winner_id`: Final winner

2. **tournament_participants**: Registered players
   - `tournament_id`: Tournament reference
   - `user_id`: Player reference
   - `bracket_position`: Position in bracket (1-100)
   - `round_eliminated`: Round where player was eliminated
   - `final_rank`: Final ranking (1 = winner)
   - `status`: registered, active, eliminated, withdrawn

3. **tournament_matches**: Tournament match tracking
   - `tournament_id`: Tournament reference
   - `match_id`: Reference to matches table
   - `round_number`: Round number (1, 2, 3, etc.)
   - `bracket_position`: Position in bracket for this round
   - `player1_bracket_position`: Original bracket position of player1
   - `player2_bracket_position`: Original bracket position of player2
   - `winner_bracket_position`: Bracket position of winner (for next round)
   - `is_bye`: True if automatic advancement (odd number of players)
   - `status`: pending, in_progress, completed

## Tournament Flow

### 1. Registration Phase
- Tournament creator sets up tournament (game, name, entry fee, max participants)
- Players register by paying entry fee
- Entry fees are deducted and added to prize pool
- Tournament status: `registration`

### 2. Bracket Generation
- When tournament reaches max participants (or creator starts it), brackets are generated
- Players are assigned bracket positions (1-100)
- First round matches are created
- Tournament status: `in_progress`, `current_round`: 1

### 3. Round Progression
- Players compete in their matches (using existing match system)
- When a match completes, the winner is determined
- When all matches in a round complete, next round is automatically generated
- Losers are marked as eliminated
- Tournament continues until one winner remains

### 4. Completion
- Final winner receives entire prize pool
- Tournament status: `completed`
- Winner is recorded in `tournament.winner_id`

## Bracket Structure

For 100 players:
- **Round 1**: 50 matches (100 → 50 winners)
- **Round 2**: 25 matches (50 → 25 winners)
- **Round 3**: 12 matches (24 players) + 1 bye = 13 winners
- **Round 4**: 6 matches (12 players) + 1 bye = 7 winners
- **Round 5**: 3 matches (6 players) + 1 bye = 4 winners
- **Round 6**: 2 matches (4 → 2 winners)
- **Round 7**: 1 match (2 → 1 winner) 🏆

## Setup Instructions

### 1. Run Database Migration

```bash
# Run the tournament schema script
psql -h your-db-host -U postgres -d your-db -f scripts/10-create-tournament-schema.sql

# Enable realtime for tournaments
psql -h your-db-host -U postgres -d your-db -f scripts/11-enable-tournament-realtime.sql
```

### 2. Access Tournaments

- Navigate to `/tournaments` to see all tournaments
- Click "Create Tournament" to set up a new tournament
- View tournament details at `/tournaments/[tournamentId]`

## Usage

### Creating a Tournament

1. Go to `/tournaments/create`
2. Select a game (Math Blitz, Four in a Row, or Trivia Challenge)
3. Enter tournament name and description
4. Set entry fee (tokens)
5. Set max participants (up to 100)
6. Click "Create Tournament"

### Registering for a Tournament

1. Go to `/tournaments/[tournamentId]`
2. Click "Register for [X] tokens"
3. Entry fee is deducted from your token balance
4. Wait for tournament to fill up or start

### Starting a Tournament

- Tournament can be started when:
  - At least 2 players are registered
  - Tournament creator is registered
  - Tournament is in `registration` status
- Click "Start Tournament" button
- Brackets are automatically generated
- First round matches are created

### Playing Tournament Matches

- Tournament matches work exactly like regular matches
- Navigate to your match from the bracket or matches tab
- Play the game as normal
- Winner automatically advances to next round

## API Functions

### `createTournament(gameId, name, description, entryFee, maxParticipants)`
Creates a new tournament in registration status.

### `registerForTournament(tournamentId)`
Registers the current user for a tournament (deducts entry fee).

### `startTournament(tournamentId)`
Generates brackets and starts the tournament.

### `advanceTournamentRound(tournamentId)`
Automatically called when all matches in a round complete. Creates next round matches.

### `getTournament(tournamentId)`
Gets tournament details.

### `getTournamentParticipants(tournamentId)`
Gets all registered participants.

### `getTournamentMatches(tournamentId, roundNumber?)`
Gets tournament matches (optionally filtered by round).

## Auto-Advancement

The tournament system automatically advances to the next round when:
- All matches in the current round are completed
- Winners are determined
- Next round matches are created

This is handled by:
1. `TournamentAutoAdvance` component monitoring match completions
2. `advanceTournamentRound` function creating next round
3. Real-time subscriptions updating the UI

## Integration with Existing Match System

Tournament matches use the existing `matches` table and match system:
- Tournament matches have `bet_amount: 0` (no individual betting)
- Matches are linked via `tournament_matches` table
- Match completion triggers tournament advancement
- All existing game components work with tournament matches

## UI Components

- **TournamentsPage** (`/tournaments`): List all tournaments
- **CreateTournamentPage** (`/tournaments/create`): Create new tournament
- **TournamentDetailPage** (`/tournaments/[tournamentId]`): View tournament details
- **TournamentDetailClient**: Interactive tournament management
- **TournamentBracket**: Visual bracket display
- **TournamentAutoAdvance**: Auto-advancement monitoring

## Notes

- Tournament matches don't have individual bets (bet_amount = 0)
- Prize pool is winner-takes-all
- Byes (automatic advancement) occur when there's an odd number of players
- Tournament status updates in real-time
- Players can view brackets even if not participating

