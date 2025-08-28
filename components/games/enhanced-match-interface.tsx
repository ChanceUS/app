"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMatchRealtime } from '@/hooks/use-match-realtime'
import { supabase } from '@/lib/supabase/client'
import type { Match, User } from '@/lib/supabase/client'
import ConnectFour from './connect-four'
import MathBlitz from './math-blitz'
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
  status: 'waiting' | 'starting' | 'playing' | 'completed'
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
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isMyTurn, setIsMyTurn] = useState(false)

  const isPlayer1 = match.player1_id === currentUser.id
  const isPlayer2 = match.player2_id === currentUser.id
  const isInMatch = isPlayer1 || isPlayer2

  // Real-time match updates
  const { 
    match: realtimeMatch, 
    isConnected, 
    error, 
    updateMatch, 
    addMatchHistory 
  } = useMatchRealtime({
    matchId: match.id,
    onMatchUpdate: handleMatchUpdate,
    onGameDataUpdate: handleGameDataUpdate
  })

  // Fetch opponent data
  useEffect(() => {
    const fetchOpponent = async () => {
      const opponentId = isPlayer1 ? match.player2_id : match.player1_id
      if (!opponentId) return

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', opponentId)
        .single()

      if (data) setOpponent(data)
    }

    fetchOpponent()
  }, [match, isPlayer1])

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

  // Start the match
  const startMatch = useCallback(async () => {
    if (!isPlayer1) return // Only player 1 can start

    try {
      await updateMatch({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })

      await addMatchHistory('match_started', {
        started_by: currentUser.id,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to start match:', error)
    }
  }, [isPlayer1, updateMatch, addMatchHistory, currentUser.id])

  // Join the match
  const joinMatch = useCallback(async () => {
    if (isInMatch || !match.player2_id) return

    try {
      await updateMatch({
        player2_id: currentUser.id
      })

      await addMatchHistory('player_joined', {
        player_id: currentUser.id,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to join match:', error)
    }
  }, [isInMatch, match.player2_id, updateMatch, addMatchHistory, currentUser.id])

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
        currentPlayer: prev.currentPlayer === match.player1_id ? match.player2_id : match.player1_id
      }))
    } catch (error) {
      console.error('Failed to make move:', error)
    }
  }, [isMyTurn, gameState, updateMatch, addMatchHistory, currentUser.id, match])

  // Handle game completion
  const handleGameComplete = useCallback(async (winner: 'player1' | 'player2' | 'draw') => {
    try {
      const winnerId = winner === 'draw' ? null : 
        winner === 'player1' ? match.player1_id : match.player2_id

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
    const gameProps = {
      onGameEnd: handleGameComplete,
      isActive: gameState.status === 'playing',
      currentPlayer: gameState.currentPlayer === match.player1_id ? 'player1' : 'player2',
      isMyTurn,
      gameData: gameState.gameData,
      onMove: handleGameMove
    }

    // Get game name from match
    const gameName = match.game_id // You'll need to fetch the actual game name

    switch (gameName) {
      case 'connect-four':
        return <ConnectFour {...gameProps} />
      case 'math-blitz':
        return <MathBlitz {...gameProps} />
      case 'trivia-challenge':
        return <TriviaChallenge {...gameProps} />
      default:
        return <div className="text-center text-gray-400">Unknown game type</div>
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
            Match #{match.id.slice(0, 8)}
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
                {isPlayer2 ? 'You' : (match.player2_id ? 'Joined' : 'Waiting...')}
              </div>
              {isPlayer2 && <Badge className="mt-2 bg-orange-500/20 text-orange-400">You</Badge>}
            </div>
          </div>
        </div>

        {/* Match Actions */}
        {match.status === 'waiting' && (
          <div className="text-center space-y-4">
            {!isInMatch ? (
              <Button onClick={joinMatch} className="btn-primary">
                Join Match
              </Button>
            ) : isPlayer1 && !match.player2_id ? (
              <div className="text-gray-400">Waiting for opponent to join...</div>
            ) : (
              <Button onClick={startMatch} disabled={!isPlayer1} className="btn-primary">
                <Play className="mr-2 h-4 w-4" />
                Start Match
              </Button>
            )}
          </div>
        )}

        {/* Game Interface */}
        {gameState.status === 'playing' && renderGame()}

        {/* Match Complete */}
        {gameState.status === 'completed' && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-white">
              {match.winner_id ? (
                <div className="flex items-center justify-center space-x-2">
                  <Trophy className="h-8 w-8 text-yellow-400" />
                  <span className="text-yellow-400">
                    {match.winner_id === currentUser.id ? 'You Won!' : 'You Lost!'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-400">It's a Draw!</span>
                </div>
              )}
            </div>
            <div className="text-gray-400">
              Match completed at {gameState.endTime?.toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
