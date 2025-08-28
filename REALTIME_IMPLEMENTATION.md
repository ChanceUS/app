# 🎮 Real-time Multiplayer Implementation

## Overview
This document explains the real-time multiplayer system implemented in ChanceUS, which enables live gameplay between two players using Supabase real-time subscriptions.

## 🏗️ Architecture

### Components
1. **`useMatchRealtime` Hook** - Manages real-time subscriptions and match state
2. **`EnhancedMatchInterface`** - Main interface for real-time multiplayer games
3. **Game Components** - Updated to work with real-time system (Connect Four, Math Blitz, Trivia Challenge)
4. **Match Page** - Dedicated page for individual matches

### Data Flow
```
Player 1 makes move → Database update → Real-time subscription → Player 2 receives update
```

## 🔧 Setup Requirements

### 1. Database Configuration
Run the SQL script to enable real-time:
```sql
-- scripts/04-enable-realtime.sql
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_history;
```

### 2. Environment Variables
Ensure your Supabase project has real-time enabled in the dashboard.

## 📱 Usage

### Basic Real-time Hook
```typescript
import { useMatchRealtime } from '@/hooks/use-match-realtime'

const { match, isConnected, updateMatch, addMatchHistory } = useMatchRealtime({
  matchId: 'match-uuid',
  onMatchUpdate: (match) => console.log('Match updated:', match),
  onGameDataUpdate: (gameData) => console.log('Game data updated:', gameData)
})
```

### Enhanced Match Interface
```typescript
import EnhancedMatchInterface from '@/components/games/enhanced-match-interface'

<EnhancedMatchInterface
  match={match}
  currentUser={user}
  onMatchComplete={(winnerId) => console.log('Winner:', winnerId)}
/>
```

## 🎯 Game Integration

### Game Component Props
All game components now accept these props:
- `onGameEnd(winner)` - Called when game completes
- `isActive` - Whether the game is currently active
- `currentPlayer` - Current player's role ("player1" or "player2")
- `isMyTurn` - Whether it's the current player's turn
- `gameData` - Current game state from database
- `onMove(moveData)` - Function to send moves to opponent

### Example: Connect Four
```typescript
const handleColumnClick = (column: number) => {
  if (!isMyTurn) return
  
  const newBoard = dropPiece(board, column, currentPlayer)
  setBoard(newBoard)
  
  // Send move to opponent via real-time
  onMove({
    board: newBoard,
    column,
    player: currentPlayer,
    timestamp: new Date().toISOString()
  })
}
```

## 🔄 Real-time Events

### Match Updates
- **Status changes** (waiting → in_progress → completed)
- **Game data updates** (moves, answers, scores)
- **Player joins/leaves**

### Match History
- **Move made** - Records each player action
- **Game completed** - Records final results
- **Player joined** - Records when players join matches

## 🎮 Game Types

### 1. Connect Four
- Turn-based gameplay
- Real-time board synchronization
- Automatic win detection

### 2. Math Blitz
- Round-based scoring
- Real-time question generation
- Timer-based scoring system

### 3. Trivia Challenge
- Category-based questions
- Real-time answer tracking
- Score accumulation

## 🚀 Features

### Real-time Synchronization
- ✅ Live game updates
- ✅ Turn management
- ✅ Score tracking
- ✅ Game state persistence

### Match Management
- ✅ Player joining/leaving
- ✅ Match start/end
- ✅ Automatic status updates
- ✅ Winner determination

### Error Handling
- ✅ Connection status monitoring
- ✅ Graceful fallbacks
- ✅ Error recovery

## 🧪 Testing

### Local Testing
1. Open two browser windows/tabs
2. Create a match in one window
3. Join the match in the other window
4. Play the game and verify real-time updates

### Debug Mode
Enable console logging to see real-time events:
```typescript
// Check connection status
console.log('Connected:', isConnected)

// Monitor match updates
console.log('Match data:', match)

// Watch for errors
console.log('Errors:', error)
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Real-time Not Working
- Check Supabase dashboard for real-time settings
- Verify database tables are added to real-time publication
- Check browser console for connection errors

#### 2. Games Not Syncing
- Ensure `onMove` callback is properly passed
- Check that game components are using `gameData` prop
- Verify real-time subscriptions are active

#### 3. Match Status Not Updating
- Check database policies for match updates
- Verify `updateMatch` function is working
- Check for JavaScript errors in console

### Debug Commands
```typescript
// Force refresh match data
await refreshMatch()

// Check subscription status
console.log('Subscription status:', isConnected)

// Manually update match
await updateMatch({ status: 'in_progress' })
```

## 🚀 Next Steps

### Planned Improvements
1. **Spectator Mode** - Allow watching games without playing
2. **Chat System** - In-game communication between players
3. **Tournament Mode** - Multi-player competitions
4. **Replay System** - Watch completed games
5. **Analytics** - Detailed game statistics

### Performance Optimizations
1. **Debounced Updates** - Reduce database calls
2. **Connection Pooling** - Better real-time management
3. **Offline Support** - Handle disconnections gracefully
4. **Caching** - Local game state caching

## 📚 Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

**Note**: This implementation provides a solid foundation for real-time multiplayer gaming. The system is designed to be extensible and can easily accommodate new game types and features.
