# 🧪 Testing Guide for New Features

## Quick Summary of Added Features

I added **4 high-priority features** to your ChanceUS platform:

1. **👀 Spectator Mode** - Watch live matches without playing
2. **▶️ Replay System** - Watch completed matches with playback controls
3. **📊 Analytics Dashboard** - Player statistics, trends, and leaderboards
4. **💬 Enhanced Chat** - Emoji reactions, timestamps, message editing

---

## 🚀 Setup Steps (Do This First!)

### Step 1: Run Database Migrations

Go to your Supabase SQL Editor and run these scripts **in order**:

1. **Spectator Mode & Replays**:
   ```sql
   -- Copy and paste contents of: scripts/19-create-spectator-replay-schema.sql
   ```

2. **Analytics Dashboard**:
   ```sql
   -- Copy and paste contents of: scripts/20-create-analytics-schema.sql
   ```

3. **Enhanced Chat**:
   ```sql
   -- Copy and paste contents of: scripts/21-enhance-chat-schema.sql
   ```

**Important**: Run them one at a time and wait for each to complete successfully.

---

## 📍 How to Find Match Pages

**The match page route is**: `/games/match/[matchId]`

**Ways to access match pages**:

1. **From Match History** (`/matches`):
   - Click the eye icon 👁️ on any match in the history table
   - This takes you directly to `/games/match/[matchId]`

2. **From Game Lobby** (`/games/[gameId]`):
   - Click "View Match" button on any waiting match
   - This takes you to `/games/match/[matchId]`

3. **From Tournaments**:
   - Click "Play Match" or "View Result" on tournament matches
   - This takes you to `/games/match/[matchId]`

4. **Direct URL**:
   - If you know the match ID (from database or URL), go to: `/games/match/YOUR_MATCH_ID`

---

## 🧪 Testing Each Feature

### 1. 👀 Spectator Mode

**What it does**: Allows users to watch ongoing matches without being a player.

**How to test**:

1. **Start a match** (as Player 1):
   - Go to `/games`
   - Create a match for any game
   - Wait for Player 2 to join (or use a second browser/incognito window)

2. **Join as spectator** (in a third browser/incognito window):
   - **Easiest way**: Go to `/watch` page (or click "Watch" in navigation)
   - You'll see a list of all live matches you can spectate
   - Click "Watch" button on any match
   - You'll be taken to the match page
   - You should see a "Spectator Mode" card
   - Click "Join as Spectator"
   - You should see the match in real-time but can't make moves
   
   **Alternative ways to find matches**:
   - Go to `/matches` page and click the eye icon on any match
   - Go to `/games/[gameId]` and click "View Match" on a waiting match
   - Or navigate directly to `/games/match/[matchId]` if you know the match ID

3. **Check spectator count**:
   - As a player, you should see the spectator count in the match interface
   - The count should update in real-time

**Expected behavior**:
- ✅ Spectators can see the match but can't play
- ✅ Spectator count displays correctly
- ✅ Players can see how many spectators are watching
- ✅ Spectators can leave spectator mode

**Where to add it**: You need to add the `SpectatorMode` component to your match pages. See integration section below.

---

### 2. ▶️ Replay System

**What it does**: Automatically creates replays when matches complete, with playback controls.

**How to test**:

1. **Complete a match**:
   - Play a match to completion (any game type)
   - The replay is automatically created when the match finishes

2. **View replay**:
   - After match completes, you can access the replay by:
     - **Option 1**: Navigate to `/replays/[matchId]` (replace `[matchId]` with actual match ID)
     - **Option 2**: Go to `/matches` page, find the completed match, and there should be a "Watch Replay" link
   - You should see the replay player with controls

3. **Test playback controls**:
   - Click play/pause
   - Use the timeline slider to seek
   - Try different playback speeds (0.5x, 1x, 1.5x, 2x)
   - Use step forward/backward buttons

4. **Test shareable link**:
   - After viewing a replay, click "Share"
   - Copy the link
   - Open in incognito window
   - Should work without being logged in (if public)

**Expected behavior**:
- ✅ Replays are created automatically when matches complete
- ✅ Playback controls work smoothly
- ✅ Timeline slider allows seeking
- ✅ Shareable links work

**Note**: Replays are created automatically, but you may need to complete a new match after running the migrations to see them.

---

### 3. 📊 Analytics Dashboard

**What it does**: Shows player statistics, performance trends, and leaderboards.

**How to test**:

1. **Navigate to analytics**:
   - Go to `/analytics`
   - You should see your statistics dashboard

2. **Check statistics cards**:
   - Total matches, wins, losses
   - Win rate percentage
   - Current win streak
   - Your rank on leaderboard

3. **View performance trends**:
   - Click "Performance Trends" tab
   - Should show a line chart of wins/losses over last 30 days
   - (May be empty if you haven't played matches recently)

4. **Check leaderboard**:
   - Click "Leaderboard" tab
   - Should show top players ranked by win rate
   - Your entry should be highlighted if you're on the list

5. **Game-specific stats**:
   - Click "Game Statistics" tab
   - Should show stats broken down by game type

**Expected behavior**:
- ✅ Statistics display correctly
- ✅ Charts render (may be empty if no recent matches)
- ✅ Leaderboard shows ranked players
- ✅ Your stats are highlighted

**Note**: Statistics are automatically updated when matches complete. If you don't see data, complete a few matches first.

---

### 4. 💬 Enhanced Chat

**What it does**: Adds emoji reactions, timestamps, message editing, and better UI to chat.

**How to test**:

1. **Find a chat window**:
   - Go to any match page: `/games/match/[matchId]` (find match ID from `/matches` page)
   - Or go to `/chat` for global chat
   - Or go to a tournament page for tournament chat

2. **Test emoji reactions**:
   - Hover over a message
   - Click the smiley face icon
   - Select an emoji (👍, ❤️, 😂, etc.)
   - The reaction should appear below the message
   - Click the reaction again to remove it

3. **Test message editing**:
   - Send a message
   - Click the three dots menu on your message
   - Click "Edit"
   - Change the message and save
   - Should show "(edited)" indicator

4. **Test message deletion**:
   - Click three dots on your message
   - Click "Delete"
   - Message should be removed

5. **Check timestamps**:
   - Messages should show relative timestamps (e.g., "2 minutes ago")
   - Timestamps are configurable in user settings

**Expected behavior**:
- ✅ Emoji reactions work and update in real-time
- ✅ Messages can be edited
- ✅ Messages can be deleted
- ✅ Timestamps display correctly
- ✅ UI is improved and responsive

**Note**: You need to replace existing `ChatWindow` components with `EnhancedChatWindow` to see these features. See integration section.

---

## 🔧 Integration Steps

### Add Spectator Mode to Match Pages

In your match interface component (e.g., `components/games/enhanced-match-interface.tsx`):

```tsx
import SpectatorMode from '@/components/games/spectator-mode'

// In your component render:
const isPlayer = match.player1_id === currentUser.id || match.player2_id === currentUser.id

<SpectatorMode 
  matchId={match.id}
  currentUser={currentUser}
  isPlayer={isPlayer}
/>
```

### Replace Chat Components

Find where you use `ChatWindow` and replace with `EnhancedChatWindow`:

```tsx
// Old
import ChatWindow from '@/components/chat/chat-window'

// New
import EnhancedChatWindow from '@/components/chat/enhanced-chat-window'

// Usage stays the same
<EnhancedChatWindow
  messageType="match"
  currentUser={currentUser}
  matchId={matchId}
  title="Match Chat"
/>
```

### Add Analytics Link to Navigation

Add a link to the analytics page in your navigation:

```tsx
<Link href="/analytics">Analytics</Link>
```

### Add Replay Links

After matches complete, you can add a "Watch Replay" button:

```tsx
import Link from 'next/link'

{match.status === 'completed' && (
  <Link href={`/replays/${match.id}`}>
    <Button>Watch Replay</Button>
  </Link>
)}
```

---

## 🐛 Troubleshooting

### "Table does not exist" errors
- **Solution**: Make sure you ran all 3 SQL migration scripts in Supabase

### Replays not showing
- **Solution**: Replays are only created for matches completed AFTER running the migrations. Complete a new match.

### Analytics showing zero stats
- **Solution**: Statistics are calculated from matches. Complete a few matches first, or the trigger will update stats automatically.

### Chat reactions not working
- **Solution**: Make sure you're using `EnhancedChatWindow` instead of `ChatWindow`

### Spectator mode not appearing
- **Solution**: Add the `SpectatorMode` component to your match pages (see integration steps above)

---

## 📝 Quick Test Checklist

- [ ] Run all 3 database migration scripts
- [ ] Complete a match and check if replay was created
- [ ] Visit `/analytics` and verify stats display
- [ ] Test spectator mode on an active match
- [ ] Test chat reactions and editing
- [ ] Verify leaderboard shows players
- [ ] Test replay playback controls
- [ ] Check shareable replay links

---

## 🎯 What's Working vs. What Needs Integration

**Fully Working** (just need database setup):
- ✅ Analytics Dashboard (`/analytics` page)
- ✅ Replay System (automatic creation, `/replays/[matchId]` pages)
- ✅ Database schemas and server actions

**Needs Integration** (components exist, need to add to pages):
- ⚠️ Spectator Mode (component ready, add to match pages)
- ⚠️ Enhanced Chat (component ready, replace old chat components)

---

## 🚨 Important Notes

1. **Database migrations are required** - Features won't work without running the SQL scripts
2. **Some features need integration** - Spectator mode and enhanced chat need to be added to existing pages
3. **Replays are automatic** - They're created when matches complete (after migrations)
4. **Statistics update automatically** - Via database triggers when matches complete

---

**Need help?** Check `FEATURES_IMPLEMENTATION.md` for detailed documentation on each feature.

