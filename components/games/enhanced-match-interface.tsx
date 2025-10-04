"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMatchRealtime } from '@/hooks/use-match-realtime'
import { supabase } from '@/lib/supabase/client'
import { completeMatch } from '@/lib/complete-match-action'
import type { Match, User, Game } from '@/lib/supabase/client'
import FourInARow from './connect-four'
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
  const [game, setGame] = useState<Game | null>(null)
  const gameStateTransitionedRef = useRef(false)
  
  // Debug: Log when opponent state changes
  useEffect(() => {
    console.log('👤 Opponent state updated:', opponent)
  }, [opponent])
  
  // Force game state to playing immediately if match is in progress
  useEffect(() => {
    console.log('🎮 Component mounted - checking game state')
    console.log('🎮 Match status:', match.status)
    console.log('🎮 Local match status:', localMatch.status)
    console.log('🎮 Game state status:', gameState.status)
    
    if ((match.status === 'in_progress' || localMatch.status === 'in_progress') && gameState.status === 'waiting' && !gameStateTransitionedRef.current) {
      console.log('🔧 IMMEDIATELY forcing game state to playing!')
      setGameState(prev => ({ ...prev, status: 'playing' }))
      gameStateTransitionedRef.current = true
    }
  }, []) // Run once on mount

  // Debug: Log when localMatch changes
  useEffect(() => {
    // Only log when status actually changes
    if (localMatch.status !== 'in_progress' || gameState.status !== 'waiting') {
      console.log('🔄 Local match state updated:', localMatch.status, 'Game state:', gameState.status)
    }
    
    // Force game state to playing if local match is in progress but game state is waiting
    if (localMatch.status === 'in_progress' && gameState.status === 'waiting' && !gameStateTransitionedRef.current) {
      console.log('🔧 Force transitioning game state to playing based on local match status')
      setGameState(prev => ({ ...prev, status: 'playing' }))
      gameStateTransitionedRef.current = true
    }
  }, [localMatch.status, gameState.status]) // Only depend on the specific status values


  // Load game information
  useEffect(() => {
    const loadGame = async () => {
      try {
        const { data: gameData, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', match.game_id)
          .single()
        
        if (error) {
          console.error('Failed to load game:', error)
        } else {
          console.log('🎮 Game loaded:', gameData)
          setGame(gameData)
        }
      } catch (error) {
        console.error('Error loading game:', error)
      }
    }

    if (match.game_id) {
      loadGame()
    }
  }, [match.game_id])

  // Poll for match completion status
  useEffect(() => {
    const pollMatchStatus = async () => {
      try {
        const { data: matchData } = await supabase
          .from('matches')
          .select('status, winner_id, completed_at, game_data')
          .eq('id', match.id)
          .single()
        
        if (matchData) {
          console.log('🔄 Polling match status:', matchData)
          
          // Update local match if status changed
          if (matchData.status !== localMatch.status) {
            console.log('🔄 Match status changed:', {
              from: localMatch.status,
              to: matchData.status
            })
            setLocalMatch(prev => ({
              ...prev,
              status: matchData.status,
              winner_id: matchData.winner_id,
              completed_at: matchData.completed_at
            }))
            
            // Update game state based on match status
            if (matchData.status === 'in_progress' && gameState.status === 'waiting') {
              console.log('🎮 Match started! Updating game state to playing...')
              setGameState(prev => ({
                ...prev,
                status: 'playing'
              }))
            }
          }
          
          // Update game state if match is completed
          if (matchData.status === 'completed' && gameState.status !== 'completed') {
            console.log('🏁 Match completed! Updating game state...')
            setGameState(prev => ({
              ...prev,
              status: 'completed'
            }))
            
            // Also update local match with winner info
            if (matchData.winner_id || matchData.completed_at) {
              setLocalMatch(prev => ({
                ...prev,
                winner_id: matchData.winner_id,
                completed_at: matchData.completed_at
              }))
            }
          }
        }
      } catch (error) {
        console.error('Error polling match status:', error)
      }
    }

    // Poll every 5 seconds to reduce console spam
    const interval = setInterval(pollMatchStatus, 5000)
    return () => clearInterval(interval)
  }, [match.id, localMatch.status, gameState.status])

  const isPlayer1 = match.player1_id === currentUser.id
  const isPlayer2 = match.player2_id === currentUser.id
  const isInMatch = isPlayer1 || isPlayer2
  
  // Check if match is completed
  const isMatchCompleted = gameState.status === 'completed' || localMatch.status === 'completed'

  // Handle match updates from WebSocket
  const handleMatchUpdateWebSocket = useCallback((updatedMatch: any) => {
    console.log('🔄 WebSocket: Match updated:', updatedMatch)
    console.log('🔄 Status change check:', {
      oldStatus: localMatch.status,
      newStatus: updatedMatch.status,
      willUpdate: updatedMatch.status !== localMatch.status
    })
    setLocalMatch(updatedMatch)
    
    // Update game state if match status changed
    if (updatedMatch.status !== localMatch.status) {
      console.log('🔄 Updating game state due to status change:', {
        from: localMatch.status,
        to: updatedMatch.status,
        newGameState: updatedMatch.status === 'completed' ? 'completed' : 
                      updatedMatch.status === 'in_progress' ? 'playing' : 'waiting'
      })
      setGameState(prev => ({
        ...prev,
        status: updatedMatch.status === 'completed' ? 'completed' : 
                updatedMatch.status === 'in_progress' ? 'playing' : prev.status
      }))
    }
  }, [localMatch.status])

  // Handle game data updates from WebSocket
  const handleGameDataUpdateWebSocket = useCallback((gameData: any) => {
    console.log('🔄 WebSocket: Game data updated:', gameData)
    
    // Update local game state with new data
    setGameState(prev => ({
      ...prev,
      gameData: { ...prev.gameData, ...gameData }
    }))
  }, [])

  // Enable WebSocket real-time synchronization
  const { 
    match: realtimeMatch, 
    isConnected, 
    error, 
    updateMatch, 
    addMatchHistory 
  } = useMatchRealtime({
    matchId: match.id,
    onMatchUpdate: handleMatchUpdateWebSocket,
    onGameDataUpdate: handleGameDataUpdateWebSocket
  })

  // Debug connection status (only log when it changes)
  useEffect(() => {
    if (error && error.includes('polling fallback')) {
      console.log('🔌 Using polling fallback:', { isConnected, error })
    }
  }, [isConnected, error])


  // Start the countdown
  const startCountdown = useCallback(async () => {
    console.log('🎮 startCountdown called - isPlayer1:', isPlayer1, 'matchId:', match.id)
    
    if (!isPlayer1) {
      console.log('⏳ Not player 1, cannot start countdown')
      return // Only player 1 can start
    }

    console.log('🎮 Player 1 starting countdown...')
    
    // Set countdown state in database so both players see it
    const { error } = await supabase
      .from('matches')
      .update({ 
        game_data: {
          ...match.game_data,
          countdown_started: true,
          countdown_start_time: new Date().toISOString()
        }
      })
      .eq('id', match.id)
    
    if (error) {
      console.error('Failed to start countdown in database:', error)
      return
    } else {
      console.log('✅ Countdown info saved to database for Player 2 sync')
    }
    
    // Set countdown state locally
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
  }, [isPlayer1, match.id, match.game_data, supabase])

  // Start the actual match (called after countdown)
  const startActualMatch = useCallback(async () => {
    try {
      console.log('🎮 Starting actual match...')
      console.log('👥 Players in match:', { player1: match.player1_id, player2: match.player2_id })
      console.log('🎮 Current game state before start:', gameState)
      console.log('🎮 Current match status before start:', localMatch.status)
      
      // Small delay to ensure countdown UI is visible
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update local state immediately
      console.log('🔄 Updating local game state to playing...')
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        startTime: new Date(),
        currentPlayer: match.player1_id
      }))
      
      // Update match status in database
      console.log('🔄 Updating match status in database to in_progress...')
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
      console.log('✅ Game should now render MultiplayerMathBlitz component')
      
      // Add match history entry
      await addMatchHistory('match_started', {
        started_by: currentUser.id,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Failed to start match:', error)
    }
  }, [isPlayer1, currentUser.id, match.player1_id, match.id, supabase, gameState, localMatch.status])

  // Poll for countdown updates (for Player 2 to sync with Player 1's countdown)
  useEffect(() => {
    if (!isPlayer2 || countdown !== null) return // Only for Player 2 and if not already in countdown

    console.log('🔍 Player 2 starting countdown polling...')

    const pollForCountdown = async () => {
      try {
        const { data: matchData, error } = await supabase
          .from('matches')
          .select('game_data')
          .eq('id', match.id)
          .single()

        if (error) {
          console.error('Error polling for countdown:', error)
          return
        }

        const gameData = matchData?.game_data
        console.log('🔍 Player 2 polling - gameData:', {
          countdown_started: gameData?.countdown_started,
          countdown_start_time: gameData?.countdown_start_time,
          hasCountdown: !!countdown
        })

        if (gameData?.countdown_started && !countdown) {
          console.log('🔢 Player 2 detected countdown start!')
          const countdownStartTime = new Date(gameData.countdown_start_time)
          const now = new Date()
          const elapsedSeconds = Math.floor((now.getTime() - countdownStartTime.getTime()) / 1000)
          
          console.log('🔢 Countdown timing:', { elapsedSeconds, remaining: 3 - elapsedSeconds })
          
          if (elapsedSeconds < 3) {
            // Countdown still in progress, sync with it
            const remainingCountdown = 3 - elapsedSeconds
            setCountdown(remainingCountdown)
            setGameState(prev => ({ ...prev, status: 'countdown' }))
            
            // Start countdown from current position
            const interval = setInterval(() => {
              setCountdown(prev => {
                if (prev === null || prev <= 1) {
                  clearInterval(interval)
                  setCountdownInterval(null)
                  startActualMatch()
                  return null
                }
                return prev - 1
              })
            }, 1000)
            setCountdownInterval(interval)
          } else {
            // Countdown already finished, start match immediately
            console.log('🔢 Countdown already finished, starting match immediately')
            setGameState(prev => ({ ...prev, status: 'playing' }))
            startActualMatch()
          }
        }
      } catch (error) {
        console.error('Error in countdown polling:', error)
      }
    }

    // Poll every 200ms for faster countdown detection
    const interval = setInterval(pollForCountdown, 200)
    
    return () => clearInterval(interval)
  }, [isPlayer2, countdown, match.id, supabase])

  // Initialize game state from database and fetch opponent data
  useEffect(() => {
    const initializeGameState = async () => {
      // Check if match is ready to play (both players present)
      if ((match.status === 'in_progress' || match.status === 'waiting' || match.status === 'completed') && match.player2_id) {
        console.log('🎮 Match ready to play, initializing game state...', { status: match.status, player2_id: match.player2_id })
        setGameState(prev => ({
          ...prev,
          status: match.status === 'completed' ? 'completed' : 
                  match.status === 'in_progress' ? 'playing' : 'waiting',
          startTime: match.started_at ? new Date(match.started_at) : new Date(),
          currentPlayer: match.player1_id
        }))
        setIsMyTurn(match.player1_id === currentUser.id)
        console.log('✅ Game state initialized from database')
        
        // Check if countdown has started in database
        if (match.game_data?.countdown_started && !countdown) {
          console.log('🔢 Countdown already started in database, syncing...')
          const countdownStartTime = new Date(match.game_data.countdown_start_time)
          const now = new Date()
          const elapsedSeconds = Math.floor((now.getTime() - countdownStartTime.getTime()) / 1000)
          
          if (elapsedSeconds < 3) {
            // Countdown still in progress, sync with it
            const remainingCountdown = 3 - elapsedSeconds
            setCountdown(remainingCountdown)
            setGameState(prev => ({ ...prev, status: 'countdown' }))
            
            // Start countdown from current position
            const interval = setInterval(() => {
              setCountdown(prev => {
                if (prev === null || prev <= 1) {
                  clearInterval(interval)
                  setCountdownInterval(null)
                  startActualMatch()
                  return null
                }
                return prev - 1
              })
            }, 1000)
            setCountdownInterval(interval)
          }
        }
        
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
      const winnerId = winner === 'draw' ? undefined : 
        winner === 'player1' ? match.player1_id : (match.player2_id || undefined)

      await updateMatch({
        status: 'completed',
        winner_id: winnerId,
        completed_at: new Date().toISOString()
      })

      await addMatchHistory('game_completed', {
        winner_id: winnerId || null,
        timestamp: new Date().toISOString()
      })

      onMatchComplete?.(winnerId || null)
    } catch (error) {
      console.error('Failed to complete game:', error)
    }
  }, [updateMatch, addMatchHistory, match, onMatchComplete])

  // Render game component based on game type
  const renderGame = useCallback(() => {
    // Only log when game state changes significantly
    if (gameState.status !== 'playing' || match.status !== 'in_progress') {
      console.log('🎮 renderGame called - gameState.status:', gameState.status, 'match.status:', match.status, 'localMatch.status:', localMatch.status)
    }
    
    // Check if this is a multiplayer match (both players present)
    // Render the game component when we have both players and the match is active
    const shouldRenderMultiplayer = match.player2_id && (
      gameState.status === 'playing' || 
      gameState.status === 'completed' || 
      gameState.status === 'starting' ||
      match.status === 'in_progress' || // Simplified condition - if match is in progress, render the game
      match.status === 'waiting' || // Also render if match is waiting but both players are present
      localMatch.status === 'in_progress' || // Also render if local match is in progress
      gameState.status === 'waiting' || // FORCE RENDER even if game state is waiting
      true // ALWAYS RENDER if we have both players
    )
    
    // Only log multiplayer decision when it changes
    if (shouldRenderMultiplayer !== (!!match.player2_id && (gameState.status === 'playing' || gameState.status === 'completed' || gameState.status === 'starting' || match.status === 'in_progress' || match.status === 'waiting'))) {
      console.log('🎮 Multiplayer render decision:', {
        hasPlayer2: !!match.player2_id,
        gameStateStatus: gameState.status,
        matchStatus: match.status,
        localMatchStatus: localMatch.status,
        shouldRenderMultiplayer,
        gameName: game?.name
      })
    }
    
    // Common game completion handler
    const handleGameComplete = async (result: any) => {
      console.log('🎮 Game completed:', result)
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
    }
    
    if (shouldRenderMultiplayer) {
      console.log('🎮 Rendering multiplayer game:', game?.name)

      // Force game state to playing if match is in progress but game state is still waiting
      if ((match.status === 'in_progress' || match.status === 'waiting' || localMatch.status === 'in_progress') && gameState.status === 'waiting') {
        console.log('🔧 Forcing game state to playing for match in progress/waiting')
        setGameState(prev => ({ ...prev, status: 'playing' }))
      }
      
      // Render the correct game component based on game type
      console.log('🎮 Game name for switch:', game?.name)
      switch (game?.name?.toLowerCase()) {
        case 'math blitz':
          return <MultiplayerMathBlitz
            matchId={match.id}
            currentUserId={currentUser.id}
            player1Id={match.player1_id}
            player2Id={match.player2_id || ''}
            onGameComplete={handleGameComplete}
          />
        case '4 in a row':
        case 'connect 4':
          console.log('🎮 Rendering Connect 4 with props:', {
            isActive: true,
            currentPlayer: currentUser.id === match.player1_id ? "player1" : "player2",
            isMyTurn: isMyTurn,
            gameState: gameState.status,
            matchStatus: match.status
          })
          return <FourInARow
            onGameEnd={handleGameComplete}
            isActive={true}
            currentPlayer={currentUser.id === match.player1_id ? "player1" : "player2"}
            isMyTurn={isMyTurn}
          />
        case 'trivia challenge':
          return <TriviaChallenge
            onGameEnd={handleGameComplete}
            isActive={true}
            currentPlayer={currentUser.id === match.player1_id ? "player1" : "player2"}
            isMyTurn={true}
          />
        default:
          console.log('🎮 Unknown game type, falling back to Math Blitz. Game name was:', game?.name)
          return <MultiplayerMathBlitz
            matchId={match.id}
            currentUserId={currentUser.id}
            player1Id={match.player1_id}
            player2Id={match.player2_id || ''}
            onGameComplete={handleGameComplete}
          />
      }
    } else if (match.player2_id) {
      // If we have both players but conditions aren't met, still try multiplayer
      console.log('⚠️ Both players present but conditions not met, forcing multiplayer render')
      console.log('⚠️ Current state:', {
        gameStateStatus: gameState.status,
        matchStatus: match.status,
        localMatchStatus: localMatch.status
      })

      // Force game state to playing if we have both players and match is in progress
      if ((match.status === 'in_progress' || localMatch.status === 'in_progress') && gameState.status === 'waiting') {
        console.log('🔧 Forcing game state to playing for sync')
        setGameState(prev => ({ ...prev, status: 'playing' }))
      }
      
      // Render the correct game component based on game type
      console.log('🎮 Fallback rendering game:', game?.name)
      switch (game?.name?.toLowerCase()) {
        case 'math blitz':
          return <MultiplayerMathBlitz
            matchId={match.id}
            currentUserId={currentUser.id}
            player1Id={match.player1_id}
            player2Id={match.player2_id || ''}
            onGameComplete={handleGameComplete}
          />
        case '4 in a row':
        case 'connect 4':
          return <FourInARow
            onGameEnd={handleGameComplete}
            isActive={true}
            currentPlayer={currentUser.id === match.player1_id ? "player1" : "player2"}
            isMyTurn={isMyTurn}
          />
        case 'trivia challenge':
          return <TriviaChallenge
            onGameEnd={handleGameComplete}
            isActive={true}
            currentPlayer={currentUser.id === match.player1_id ? "player1" : "player2"}
            isMyTurn={true}
          />
        default:
          console.log('🎮 Fallback: Unknown game type, falling back to Math Blitz. Game name was:', game?.name)
          return <MultiplayerMathBlitz
            matchId={match.id}
            currentUserId={currentUser.id}
            player1Id={match.player1_id}
            player2Id={match.player2_id || ''}
            onGameComplete={handleGameComplete}
          />
      }
    } else {
      // Fallback to single-player games (only when no second player)
      console.log('🎮 Rendering single-player game:', game?.name)
      
      switch (game?.name?.toLowerCase()) {
        case 'math blitz':
          return <MathBlitz 
            savedGameData={match.game_data}
            onGameUpdate={(gameData) => {
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
        case 'trivia challenge':
          return <TriviaChallenge
            onGameEnd={(result) => console.log('Single player trivia completed:', result)}
            isActive={true}
            currentPlayer="player1"
            isMyTurn={true}
          />
        case '4 in a row':
        case 'connect 4':
          return <FourInARow
            onGameEnd={(result) => console.log('Single player 4 in a row completed:', result)}
            isActive={true}
            currentPlayer="player1"
            isMyTurn={true}
          />
        default:
          console.log('🎮 Unknown game type, falling back to Math Blitz')
          return <MathBlitz 
            savedGameData={match.game_data}
            onGameUpdate={(gameData) => {
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
  }, [match, gameState, localMatch, game, isMyTurn, handleGameComplete])


  // Show warning if not connected but continue with game (WebSocket is optional)
  useEffect(() => {
    if (!isConnected && !error) {
      console.log('⚠️ WebSocket not connected, but continuing with game (polling fallback)')
    }
  }, [isConnected, error])

  // Fallback: Check database status when WebSocket is not connected
  useEffect(() => {
    if (!isConnected && !error) {
      const checkDatabaseStatus = async () => {
        try {
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select('status, game_data')
            .eq('id', match.id)
            .single()
          
          if (matchError) {
            console.error('❌ Failed to check database status:', matchError)
            return
          }
          
          // Only log when status actually changes
          if (matchData && matchData.status !== localMatch.status) {
            console.log('🔄 Database status check result:', {
              databaseStatus: matchData.status,
              localStatus: localMatch.status,
              gameStateStatus: gameState.status,
              shouldUpdate: matchData.status !== localMatch.status
            })
          }
          
          if (matchData && matchData.status !== localMatch.status) {
            console.log('🔄 Database status differs from local status, updating...')
            
            setLocalMatch(prev => ({
              ...prev,
              status: matchData.status,
              game_data: matchData.game_data
            }))
            
            // Also update game state if needed
            if (matchData.status === 'in_progress' && gameState.status !== 'playing') {
              console.log('🔄 Updating game state to playing based on database status')
              setGameState(prev => ({
                ...prev,
                status: 'playing'
              }))
            }
          }
        } catch (error) {
          console.error('❌ Error checking database status:', error)
        }
      }
      
      // Check immediately and then every 5 seconds
      checkDatabaseStatus()
      const interval = setInterval(checkDatabaseStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [isConnected, error, match.id, localMatch.status, gameState.status, supabase])

  // Early return for connection errors (must be after all hooks)
  if (error) {
    return (
      <Card className="bg-gray-900/50 border-red-500/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">Connection Error: {error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
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
                   <Badge className="bg-blue-500/20 text-blue-400">
                     <div className="w-2 h-2 rounded-full mr-2 bg-blue-400" />
                     Polling
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
        {/* Connection Status - Hidden since polling is working fine */}
        {false && error && error.includes('polling fallback') && (
          <Alert className="bg-blue-500/20 border-blue-500/30 text-blue-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Using polling for updates - game will work normally
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Status - Hidden for normal use */}
        {false && (
          <Alert className="bg-gray-500/20 border-gray-500/30 text-gray-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Debug: match.status={match.status}, localMatch.status={localMatch.status}, gameState.status={gameState.status}, hasPlayer2={!!match.player2_id}
            </AlertDescription>
          </Alert>
        )}

        {/* Force Game Render - Hidden for normal use */}
        {false && match.player2_id && (
          <Alert className="bg-green-500/20 border-green-500/30 text-green-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Both players present - game should render below
            </AlertDescription>
          </Alert>
        )}

        {/* Game Component - ALWAYS RENDER */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-white text-lg mb-4">Connect 4 Game Board</h3>
          <div className="text-gray-300 mb-4">
            <p>Match ID: {match.id}</p>
            <p>Player 1: {match.player1_id}</p>
            <p>Player 2: {match.player2_id || 'No player 2 yet'}</p>
            <p>Game State: {gameState.status}</p>
            <p>Has Player 2: {match.player2_id ? 'Yes' : 'No'}</p>
          </div>
          {/* Force render Connect 4 directly */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white mb-4">Connect 4 Game</h4>
            <div className="text-center text-gray-300">
              <p>Game is ready to play!</p>
              <p>Click on column arrows to place chips</p>
              <div className="mt-4 grid grid-cols-7 gap-2 max-w-md mx-auto">
                {Array.from({ length: 7 }, (_, col) => (
                  <button
                    key={col}
                    className="h-8 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded"
                  >
                    ↓
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2 max-w-md mx-auto">
                {Array.from({ length: 42 }, (_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gray-700 rounded-full border-2 border-gray-600"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

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
                    ) : gameState.status === 'playing' ? (
                      <div className="text-center text-gray-400">
                        Game in progress...
                      </div>
                    ) : isMatchCompleted ? (
                      <div className="text-center space-y-4">
                        <div className="text-2xl font-bold text-green-400 mb-4">
                          🎉 Match Completed!
                        </div>
                        
                        {/* Winner Display */}
                        {localMatch.winner_id ? (
                          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                            <div className="text-green-400 font-semibold text-lg mb-2">
                              🏆 Winner: {
                                localMatch.winner_id === match.player1_id 
                                  ? 'Player 1'
                                  : 'Player 2'
                              }
                            </div>
                            <div className="text-green-300 text-sm">
                              Congratulations on your victory!
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                            <div className="text-yellow-400 font-semibold text-lg">
                              🤝 It's a Draw!
                            </div>
                            <div className="text-yellow-300 text-sm">
                              Great game, both players!
                            </div>
                          </div>
                        )}
                        
                        {/* Game Data Results */}
                        {localMatch.game_data && (
                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            <div className="text-white font-medium mb-2">Game Results:</div>
                            <div className="text-gray-300 text-sm">
                              {JSON.stringify(localMatch.game_data, null, 2)}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-gray-400 text-sm">
                          Match completed at {localMatch.completed_at ? new Date(localMatch.completed_at).toLocaleString() : 'Unknown time'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button onClick={startMatch} className="btn-primary">
                          <Play className="mr-2 h-4 w-4" />
                          Start Match
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-gray-400 text-sm">
                  {localMatch.player2_id ? 
                    (gameState.status === 'countdown' ? 'Match starting...' : 
                     gameState.status === 'playing' ? 'Game in progress...' :
                     isMatchCompleted ? 'Match completed!' :
                     'Waiting for Player 1 to start the match...') : 
                    'Waiting for Player 2 to join...'}
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

        {/* Debug Info */}
        <div className="text-xs text-gray-500 bg-gray-800/30 p-2 rounded">
          Debug: localMatch.status={localMatch.status}, gameState.status={gameState.status}, isPlayer1={isPlayer1}, hasPlayer2={!!localMatch.player2_id}
        </div>

        {/* Countdown Display - Show regardless of match status */}
        {gameState.status === 'countdown' && countdown !== null && localMatch.status !== 'waiting' && (
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-orange-400 mb-4 animate-pulse">
              {countdown}
            </div>
            <div className="text-gray-400 text-lg">
              Get ready!
            </div>
          </div>
        )}

        {/* Game Interface */}
        {(gameState.status === 'playing' || gameState.status === 'completed') && (
          <div>
            {renderGame()}
          </div>
        )}
        
        {/* Show countdown in game interface when countdown is active */}
        {gameState.status === 'countdown' && (
          <div>
            {renderGame()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}