"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMatchRealtime } from '@/hooks/use-match-realtime'
import { supabase } from '@/lib/supabase/client'
import { completeMatch } from '@/lib/complete-match-action'
import type { Match, User } from '@/lib/supabase/client'
import ConnectFour from './connect-four'
import MathBlitz from './math-blitz'
import MultiplayerMathBlitz from './multiplayer-math-blitz'
import TriviaChallenge from './trivia-challenge'
import { 
  Users, 
  Clock, 
  Trophy, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Play,
  Pause
} from 'lucide-react'

interface EnhancedMatchInterfaceProps {
  match: Match
  currentUser: User
  onMatchComplete?: (winnerId: string | null) => void
}

interface GameState {
  status: 'waiting' | 'countdown' | 'starting' | 'playing' | 'completed'
  currentPlayer: string | null
  gameData: any
  startTime?: Date
  endTime?: Date
}

export default function EnhancedMatchInterface({ 
  match, 
  currentUser, 
  onMatchComplete 
}: EnhancedMatchInterfaceProps) {
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    currentPlayer: null,
    gameData: match.game_data || {}
  })
  const [opponent, setOpponent] = useState<User | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [showJoinNotification, setShowJoinNotification] = useState(false)
  const [localMatch, setLocalMatch] = useState(match) // Local copy of match data for real-time updates
  
  // Debug: Log when opponent state changes
  useEffect(() => {
    console.log('👤 Opponent state updated:', opponent)
  }, [opponent])
  
  // Debug: Log when localMatch changes
  useEffect(() => {
    console.log('🔄 Local match state updated:', localMatch)
  }, [localMatch])

  const isPlayer1 = match.player1_id === currentUser.id
  const isPlayer2 = match.player2_id === currentUser.id
  const isInMatch = isPlayer1 || isPlayer2

  // Temporarily disable real-time updates to fix connection issues
  // const { 
  //   match: realtimeMatch, 
  //   isConnected, 
  //   error, 
  //   updateMatch, 
  //   addMatchHistory 
  // } = useMatchRealtime({
  //   matchId: match.id,
  //   onMatchUpdate: handleMatchUpdate,
  //   onGameDataUpdate: handleGameDataUpdate
  // })
  
  // Use mock values for now
  const isConnected = true
  const error = null
  const updateMatch = async (updates: any) => console.log('Match update:', updates)
  const addMatchHistory = async (type: string, data: any) => console.log('Match history:', type, data)

  // Start the countdown
  const startCountdown = useCallback(() => {
    if (!isPlayer1) return // Only player 1 can start

    console.log('🎮 Starting countdown...')
    
    // Set countdown state
    setGameState(prev => ({
      ...prev,
      status: 'countdown'
    }))
    
    // Start countdown from 3
    setCountdown(3)
    console.log('🔢 Countdown set to 3')
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        console.log('⏰ Countdown tick:', prev)
        if (prev === null || prev <= 1) {
          // Countdown finished, start the actual match
          console.log('🏁 Countdown finished, starting match!')
          clearInterval(interval)
          setCountdownInterval(null)
          startActualMatch()
          return null
        }
        return prev - 1
      })
    }, 1000)
    
    setCountdownInterval(interval)
  }, [isPlayer1])

  // Start the actual match (called after countdown)
  const startActualMatch = useCallback(async () => {
    try {
      console.log('🎮 Starting actual match...')
      console.log('👥 Players in match:', { player1: match.player1_id, player2: match.player2_id })
      
      // Small delay to ensure countdown UI is visible
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update local state immediately
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        startTime: new Date(),
        currentPlayer: match.player1_id
      }))
      
      // Update match status in database
      const { error } = await supabase
        .from('matches')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', match.id)
      
      if (error) {
        console.error('Failed to update match status:', error)
        return
      }
      
      console.log('✅ Match started successfully!')
      
      // Add match history entry
      await addMatchHistory('match_started', {
        started_by: currentUser.id,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Failed to start match:', error)
    }
  }, [isPlayer1, currentUser.id, match.player1_id, match.id, supabase])

  // Initialize game state from database and fetch opponent data
  useEffect(() => {
    const initializeGameState = async () => {
      // Check if match is ready to play (both players present)
      if ((match.status === 'in_progress' || match.status === 'waiting' || match.status === 'completed') && match.player2_id) {
        console.log('🎮 Match ready to play, initializing game state...', { status: match.status, player2_id: match.player2_id })
        setGameState(prev => ({
          ...prev,
          status: match.status === 'completed' ? 'completed' : 'playing',
          startTime: match.started_at ? new Date(match.started_at) : new Date(),
          currentPlayer: match.player1_id
        }))
        setIsMyTurn(match.player1_id === currentUser.id)
        console.log('✅ Game state initialized from database')
        
        // Auto-start countdown if both players are ready and match is waiting
        if (match.status === 'waiting' && isPlayer1) {
          console.log('🚀 Both players already present! Auto-starting countdown...')
          setTimeout(() => {
            startCountdown()
          }, 2000) // Small delay to let UI settle
        }
      }

      // Fetch opponent data
      const opponentId = isPlayer1 ? match.player2_id : match.player1_id
      if (!opponentId) return

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', opponentId)
        .single()

      if (data) setOpponent(data)
    }

    initializeGameState()

    // Set up real-time listener for match updates
    const matchSubscription = supabase
      .channel(`match:${match.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'matches',
          filter: `id=eq.${match.id}`
        }, 
        (payload) => {
          console.log('🔄 Match updated in real-time:', payload.new)
          const updatedMatch = payload.new as Match
          
          // Check if player2 joined
          if (updatedMatch.player2_id && !localMatch.player2_id) {
            console.log('🎉 Player 2 joined the match!')
            
            // Update the local match state to reflect the new player2_id
            // This ensures the UI updates immediately
            const updatedMatchData = {
              ...localMatch,
              player2_id: updatedMatch.player2_id,
              status: updatedMatch.status
            }
            setLocalMatch(updatedMatchData)
            
            // Fetch the new player's data
            supabase
              .from('users')
              .select('*')
              .eq('id', updatedMatch.player2_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setOpponent(data)
                  console.log('✅ Opponent data updated:', data.display_name)
                  
                  // Show join notification
                  setShowJoinNotification(true)
                  setTimeout(() => setShowJoinNotification(false), 5000) // Hide after 5 seconds
                  
                  // Force a re-render by updating some state
                  setGameState(prev => ({
                    ...prev,
                    // Trigger re-render when opponent joins
                    lastUpdate: Date.now()
                  }))
                  
                  // Auto-start countdown when both players are ready
                  if (isPlayer1 && gameState.status === 'waiting') {
                    console.log('🚀 Both players ready! Auto-starting countdown...')
                    setTimeout(() => {
                      startCountdown()
                    }, 1000) // Small delay to let UI update
                  }
                }
              })
          }
          
          // Check if match status changed
          if (updatedMatch.status !== match.status) {
            console.log(`🔄 Match status changed: ${match.status} → ${updatedMatch.status}`)
            if (updatedMatch.status === 'in_progress') {
              handleStatusChange('in_progress')
            }
          }
        }
      )
      .subscribe()

    // Set up real-time listener for match history updates
    const historySubscription = supabase
      .channel(`match_history:${match.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'match_history',
          filter: `match_id=eq.${match.id}`
        }, 
        (payload) => {
          console.log('📜 Match history updated:', payload.new)
          const historyEntry = payload.new as any
          
          if (historyEntry.action_type === 'player_joined') {
            console.log('🎉 Player joined event detected!')
            // The match update listener will handle the actual player data update
          }
        }
      )
      .subscribe()

    return () => {
      matchSubscription.unsubscribe()
      historySubscription.unsubscribe()
    }
  }, [localMatch, isPlayer1, currentUser.id, supabase])

  // Handle real-time match updates
  function handleMatchUpdate(updatedMatch: Match) {
    if (updatedMatch.status !== match.status) {
      handleStatusChange(updatedMatch.status)
    }
    
    if (updatedMatch.game_data !== match.game_data) {
      setGameState(prev => ({
        ...prev,
        gameData: updatedMatch.game_data || {}
      }))
    }
  }

  // Handle game data updates
  function handleGameDataUpdate(gameData: any) {
    setGameState(prev => ({
      ...prev,
      gameData
    }))
  }

  // Handle match status changes
  function handleStatusChange(newStatus: string) {
    switch (newStatus) {
      case 'in_progress':
        setGameState(prev => ({
          ...prev,
          status: 'playing',
          startTime: new Date(),
          currentPlayer: match.player1_id // Player 1 starts
        }))
        setIsMyTurn(match.player1_id === currentUser.id)
        break
      case 'completed':
        setGameState(prev => ({
          ...prev,
          status: 'completed',
          endTime: new Date()
        }))
        break
    }
  }

  // Alias for backward compatibility
  const startMatch = startCountdown

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  }, [countdownInterval])

  // Join the match
  const joinMatch = useCallback(async () => {
    if (isInMatch || match.player2_id) return

    try {
      console.log('🎮 Player joining match...')
      
      // Update the match in the database
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          player2_id: currentUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', match.id)
      
      if (updateError) {
        console.error('Failed to join match:', updateError)
        return
      }
      
      console.log('✅ Player joined match successfully')
      
      // Add match history
      const { error: historyError } = await supabase
        .from('match_history')
        .insert({
          match_id: match.id,
          user_id: currentUser.id,
          action_type: 'player_joined',
          action_data: {
            player_id: currentUser.id,
            timestamp: new Date().toISOString()
          }
        })
      
      if (historyError) {
        console.error('Failed to add match history:', historyError)
      } else {
        console.log('✅ Match history added for player join')
      }
      
      // Update local state to show player has joined
      setOpponent(currentUser)
      
    } catch (error) {
      console.error('Failed to join match:', error)
    }
  }, [isInMatch, match.player2_id, match.id, currentUser.id, supabase])

  // Handle game move
  const handleGameMove = useCallback(async (moveData: any) => {
    if (!isMyTurn || gameState.status !== 'playing') return

    try {
      const newGameData = {
        ...gameState.gameData,
        ...moveData,
        lastMove: {
          player: currentUser.id,
          timestamp: new Date().toISOString(),
          data: moveData
        }
      }

      await updateMatch({
        game_data: newGameData
      })

      await addMatchHistory('move_made', {
        player_id: currentUser.id,
        move_data: moveData,
        timestamp: new Date().toISOString()
      })

      // Switch turns
      setIsMyTurn(false)
      setGameState(prev => ({
        ...prev,
        currentPlayer: prev.currentPlayer === match.player1_id ? (match.player2_id || null) : match.player1_id
      }))
    } catch (error) {
      console.error('Failed to make move:', error)
    }
  }, [isMyTurn, gameState, updateMatch, addMatchHistory, currentUser.id, match])

  // Handle game completion
  const handleGameComplete = useCallback(async (winner: 'player1' | 'player2' | 'draw') => {
    try {
      const winnerId = winner === 'draw' ? null : 
        winner === 'player1' ? match.player1_id : (match.player2_id || null)

      await updateMatch({
        status: 'completed',
        winner_id: winnerId,
        completed_at: new Date().toISOString()
      })

      await addMatchHistory('game_completed', {
        winner_id: winnerId,
        timestamp: new Date().toISOString()
      })

      onMatchComplete?.(winnerId)
    } catch (error) {
      console.error('Failed to complete game:', error)
    }
  }, [updateMatch, addMatchHistory, match, onMatchComplete])

  // Render game component based on game type
  const renderGame = () => {
    // Check if this is a multiplayer match (both players present)
    if (match.player2_id && (gameState.status === 'playing' || gameState.status === 'completed' || match.status === 'in_progress' || match.status === 'completed')) {
      // Use multiplayer Math Blitz for head-to-head competition
      return <MultiplayerMathBlitz
        matchId={match.id}
        currentUserId={currentUser.id}
        player1Id={match.player1_id}
        player2Id={match.player2_id}
        onGameComplete={async (result) => {
          console.log('🎮 Multiplayer game completed:', result)
          // Handle game completion - update match with winner
          const winnerId = result.winner === 'player1' ? match.player1_id : 
                          result.winner === 'player2' ? match.player2_id : null
          
          console.log('🔄 Updating match status to completed via server action:', {
            matchId: match.id,
            winnerId,
            result
          })
          
          try {
            const serverResult = await completeMatch(match.id, winnerId || null, result)
            
            if (serverResult.success) {
              console.log('✅ Server action: Match completed successfully:', serverResult.data)
              // Update local state to show completed status
              setGameState(prev => ({
                ...prev,
                status: 'completed'
              }))
            } else {
              console.error('❌ Server action: Failed to complete match:', serverResult.error)
            }
          } catch (error) {
            console.error('❌ Server action: Unexpected error:', error)
          }
        }}
      />
    } else {
      // Fallback to single-player Math Blitz
      return <MathBlitz 
        savedGameData={match.game_data}
        onGameUpdate={(gameData) => {
          // Save game progress to database
          supabase
            .from('matches')
            .update({ game_data: gameData })
            .eq('id', match.id)
            .then(({ error }) => {
              if (error) console.error('Failed to save game data:', error)
              else console.log('✅ Game progress saved')
            })
        }}
      />
    }
  }

  // Render connection status
  if (!isConnected) {
    return (
      <Card className="bg-gray-900/50 border-yellow-500/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-400">Connecting to match...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render error state
  if (error) {
    return (
      <Card className="bg-gray-900/50 border-red-500/20">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Connection error: {error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-orange-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Users className="mr-2 h-5 w-5 text-orange-400" />
            Match Status
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={`${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge className="bg-orange-500/20 text-orange-400">
              {match.bet_amount} tokens
            </Badge>
          </div>
        </div>

        {/* Match Status */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Status: {match.status}</span>
            {gameState.startTime && (
              <span>Started: {gameState.startTime.toLocaleTimeString()}</span>
            )}
            {localMatch.status === 'waiting' && (
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{localMatch.player2_id ? '2/2' : '1/2'} Players</span>
                {localMatch.player2_id && (
                  <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">
                    Ready to Start
                  </Badge>
                )}
              </span>
            )}
          </div>
          {gameState.status === 'playing' && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Turn: {isMyTurn ? 'Your turn' : 'Opponent\'s turn'}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Join Notification */}
        {showJoinNotification && (
          <Alert className="bg-green-500/20 border-green-500/30 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              🎉 A player has joined the match! You can now start playing.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Player Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${isPlayer1 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-800/30'}`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Player 1</div>
              <div className="text-white font-medium">
                {isPlayer1 ? 'You' : opponent?.display_name || 'Waiting...'}
              </div>
              {isPlayer1 && <Badge className="mt-2 bg-orange-500/20 text-orange-400">You</Badge>}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isPlayer2 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-800/30'}`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Player 2</div>
              <div className="text-white font-medium">
                {isPlayer2 ? 'You' : (localMatch.player2_id ? 'Joined' : 'Waiting...')}
              </div>
              {isPlayer2 && <Badge className="mt-2 bg-orange-500/20 text-orange-400">You</Badge>}
            </div>
          </div>
        </div>

        {/* Match Actions */}
        {localMatch.status === 'waiting' && (
          <div className="text-center space-y-4">
            {!isInMatch ? (
              <div className="space-y-3">
                <div className="text-gray-400 text-sm">
                  {localMatch.player2_id ? 'Match is full' : 'Join this match to play!'}
                </div>
                {!localMatch.player2_id && (
                  <Button onClick={joinMatch} className="btn-primary">
                    Join Match
                  </Button>
                )}
              </div>
            ) : isPlayer1 ? (
              <div className="space-y-3">
                <div className="text-gray-400 text-sm">
                  {localMatch.player2_id ? 'Both players ready! You can start the match.' : 'Waiting for Player 2 to join...'}
                </div>
                {localMatch.player2_id && (
                  <>
                    {gameState.status === 'countdown' && countdown !== null ? (
                      <div className="text-center">
                        <div className="text-6xl font-bold text-orange-400 mb-4 animate-pulse">
                          {countdown}
                        </div>
                        <div className="text-gray-400 text-lg">
                          Get ready!
                        </div>
                      </div>
                    ) : gameState.status === 'playing' || gameState.status === 'completed' ? (
                      <div className="text-center text-gray-400">
                        Game in progress...
                      </div>
                    ) : (
                      <Button onClick={startMatch} className="btn-primary">
                        <Play className="mr-2 h-4 w-4" />
                        Start Match
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-gray-400 text-sm">
                  {localMatch.player2_id ? 'Waiting for Player 1 to start the match...' : 'Waiting for Player 2 to join...'}
                </div>
                {gameState.status === 'countdown' && countdown !== null && (
                  <div className="text-center">
                    <div className="text-6xl font-bold text-orange-400 mb-4 animate-pulse">
                      {countdown}
                    </div>
                    <div className="text-gray-400 text-lg">
                      Get ready!
                    </div>
                  </div>
                )}
                {!localMatch.player2_id && (
                  <div className="text-orange-400 text-sm">You joined! Waiting for another player...</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Game Interface */}
        {(gameState.status === 'playing' || gameState.status === 'completed') && (
          <div>
            {renderGame()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}