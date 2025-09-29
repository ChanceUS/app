"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Timer, Target, Zap, Users, CheckCircle, XCircle } from "lucide-react"
import { 
  MultiplayerGameState, 
  MathProblem, 
  PlayerAnswer,
  MultiplayerResult,
  initializeMultiplayerGame,
  submitPlayerAnswer,
  markPlayerFinished,
  calculateMultiplayerResult
} from "@/lib/game-logic"

interface MultiplayerMathBlitzProps {
  matchId: string
  currentUserId: string
  player1Id: string
  player2Id: string
  onGameComplete?: (result: MultiplayerResult) => void
}

export default function MultiplayerMathBlitz({ 
  matchId, 
  currentUserId, 
  player1Id, 
  player2Id,
  onGameComplete 
}: MultiplayerMathBlitzProps) {
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null)
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [gameResult, setGameResult] = useState<MultiplayerResult | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false) // Auto-start since countdown already happened
  const [hasAnsweredCurrentProblem, setHasAnsweredCurrentProblem] = useState(false)
  const [localAnswerSubmitted, setLocalAnswerSubmitted] = useState(false)

  const isPlayer1 = currentUserId === player1Id
  const playerId = isPlayer1 ? 'player1' : 'player2'
  
  // Check if both players have answered the current question using shared state
  const [sharedState, setSharedState] = useState<any>(null)
  
  useEffect(() => {
    const checkSharedState = () => {
      const stored = localStorage.getItem(`gameState_${matchId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSharedState(parsed)
        console.log('🔄 Shared state updated:', {
          p1Answers: parsed.player1Answers.length,
          p2Answers: parsed.player2Answers.length,
          currentIndex: parsed.currentProblemIndex
        })
      }
    }
    checkSharedState()
    const interval = setInterval(checkSharedState, 100)
    return () => clearInterval(interval)
  }, [matchId])

  const bothPlayersAnswered = sharedState && currentProblem && 
    sharedState.player1Answers.length >= sharedState.currentProblemIndex + 1 &&
    sharedState.player2Answers.length >= sharedState.currentProblemIndex + 1
  
  // Alternative check: if both players have answered at least the current problem
  const bothPlayersAnsweredAlt = sharedState && currentProblem && 
    sharedState.player1Answers.length > sharedState.currentProblemIndex &&
    sharedState.player2Answers.length > sharedState.currentProblemIndex
  
  // Debug logging
  if (gameState && currentProblem) {
    console.log('🔍 Answer status check:', {
      localState: {
        currentProblemIndex: gameState.currentProblemIndex,
        player1Answers: gameState.player1Answers.length,
        player2Answers: gameState.player2Answers.length,
        player1Score: gameState.player1Score,
        player2Score: gameState.player2Score,
      },
      sharedState: sharedState ? {
        currentProblemIndex: sharedState.currentProblemIndex,
        player1Answers: sharedState.player1Answers.length,
        player2Answers: sharedState.player2Answers.length,
        player1Score: sharedState.player1Score,
        player2Score: sharedState.player2Score,
      } : null,
      bothPlayersAnswered,
      bothPlayersAnsweredAlt,
      localAnswerSubmitted,
      playerId,
      shouldShowWaiting: localAnswerSubmitted && !bothPlayersAnswered && !bothPlayersAnsweredAlt,
      shouldShowBothAnswered: bothPlayersAnswered || bothPlayersAnsweredAlt
    })
  }

  // Initialize game
  useEffect(() => {
    if (!gameState) {
      const initialState = initializeMultiplayerGame(matchId)
      setGameState(initialState)
      setCurrentProblem(initialState.problems[0])
      setTimeRemaining(initialState.problems[0].timeLimit)
      setIsMyTurn(true) // Both players can start immediately
      
      // Save initial state to localStorage for sharing between players
      localStorage.setItem(`gameState_${matchId}`, JSON.stringify(initialState))
    }
  }, [matchId, gameState])

  // Poll for shared game state updates
  useEffect(() => {
    const pollForSharedState = () => {
      try {
        const sharedState = localStorage.getItem(`gameState_${matchId}`)
        if (sharedState) {
          const parsedState = JSON.parse(sharedState)
          
          // Get current state from the state setter function
          setGameState(currentState => {
            if (!currentState) return currentState
            
            // Check if the shared state is different from our local state
            const indexChanged = parsedState.currentProblemIndex !== currentState.currentProblemIndex
            const p1Changed = parsedState.player1Answers.length !== currentState.player1Answers.length
            const p2Changed = parsedState.player2Answers.length !== currentState.player2Answers.length
            
            if (indexChanged || p1Changed || p2Changed) {
              console.log('🔄 Shared state update detected:', {
                sharedIndex: parsedState.currentProblemIndex,
                localIndex: currentState.currentProblemIndex,
                sharedP1: parsedState.player1Answers.length,
                localP1: currentState.player1Answers.length,
                sharedP2: parsedState.player2Answers.length,
                localP2: currentState.player2Answers.length,
                changes: { indexChanged, p1Changed, p2Changed }
              })
              
              return parsedState
            }
            
            return currentState
          })
        }
      } catch (error) {
        console.error('Error polling shared state:', error)
      }
    }

    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `gameState_${matchId}` && e.newValue) {
        console.log('🔄 Storage event detected, checking for updates...')
        pollForSharedState()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(pollForSharedState, 200) // Poll every 200ms for faster updates
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [matchId]) // Removed gameState from dependencies

  // Timer countdown
  useEffect(() => {
    if (!gameState || gameState.player1Finished && gameState.player2Finished) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - submit no answer
          handleAnswer(-1) // -1 indicates no answer/timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  // Update opponent progress from shared state
  useEffect(() => {
    if (!sharedState) return

    const opponentAnswers = isPlayer1 ? sharedState.player2Answers : sharedState.player1Answers
    const opponentScore = isPlayer1 ? sharedState.player2Score : sharedState.player1Score
    
    setOpponentProgress(opponentAnswers.length)
    
    console.log('🔄 Opponent progress updated:', {
      isPlayer1,
      opponentAnswers: opponentAnswers.length,
      opponentScore,
      player1Score: sharedState.player1Score,
      player2Score: sharedState.player2Score
    })
  }, [sharedState, isPlayer1])

  // Handle question advancement when game state changes
  useEffect(() => {
    if (!gameState || !currentProblem) return
    
    console.log('🔄 Game state changed, checking question advancement:', {
      currentProblemIndex: gameState.currentProblemIndex,
      currentProblemId: currentProblem.id,
      problemsLength: gameState.problems.length
    })
    
    // Update current problem if index changed
    if (gameState.currentProblemIndex < gameState.problems.length) {
      const newProblem = gameState.problems[gameState.currentProblemIndex]
      if (newProblem && newProblem.id !== currentProblem.id) {
        console.log('➡️ Updating to new problem:', newProblem.id)
        setCurrentProblem(newProblem)
        setTimeRemaining(newProblem.timeLimit)
        setHasAnsweredCurrentProblem(false) // Reset answer flag for new question
        setLocalAnswerSubmitted(false) // Reset local answer flag for new question
      }
    }
  }, [gameState, currentProblem])

  // Simple polling to sync state between players
  useEffect(() => {
    const pollForUpdates = () => {
      const sharedState = localStorage.getItem(`gameState_${matchId}`)
      if (sharedState) {
        const parsedState = JSON.parse(sharedState)
        
        // Sync the state and handle game completion
        setGameState(currentState => {
          if (!currentState) return currentState
          
          if (parsedState.currentProblemIndex !== currentState.currentProblemIndex ||
              parsedState.player1Answers.length !== currentState.player1Answers.length ||
              parsedState.player2Answers.length !== currentState.player2Answers.length ||
              parsedState.player1Finished !== currentState.player1Finished ||
              parsedState.player2Finished !== currentState.player2Finished) {
            
            console.log('🔄 Syncing state from shared:', {
              sharedIndex: parsedState.currentProblemIndex,
              localIndex: currentState.currentProblemIndex,
              sharedP1: parsedState.player1Answers.length,
              localP1: currentState.player1Answers.length,
              sharedP2: parsedState.player2Answers.length,
              localP2: currentState.player2Answers.length,
              gameFinished: parsedState.player1Finished && parsedState.player2Finished
            })
            
            // If game is finished, calculate and set the result
            if (parsedState.player1Finished && parsedState.player2Finished && !currentState.player1Finished) {
              console.log('🏁 Game finished via sync, calculating results...')
              const result = calculateMultiplayerResult(parsedState)
              setGameResult(result)
              onGameComplete?.(result)
            }
            
            return parsedState
          }
          
          return currentState
        })
      }
    }

    const interval = setInterval(pollForUpdates, 200) // Simple polling every 200ms
    return () => clearInterval(interval)
  }, [matchId])

  const handleAnswer = useCallback((answer: number) => {
    if (!gameState || !currentProblem) {
      console.log('⚠️ Cannot answer - missing state:', { 
        hasGameState: !!gameState, 
        hasCurrentProblem: !!currentProblem
      })
      return
    }

    if (localAnswerSubmitted) {
      console.log('⚠️ Cannot answer - already answered this question:', { 
        localAnswerSubmitted,
        currentProblemIndex: gameState.currentProblemIndex,
        playerId
      })
      return
    }

    console.log('🎯 Answer submitted:', { answer, currentProblemIndex: gameState.currentProblemIndex, playerId })
    console.log('🎯 Player details:', { isPlayer1, playerId, currentUserId, player1Id })
    
    // Mark as answered locally to prevent multiple clicks
    setLocalAnswerSubmitted(true)
    
    const timeSpent = currentProblem.timeLimit - timeRemaining
    const newGameState = submitPlayerAnswer(gameState, playerId, answer, timeSpent)
    
    console.log('🔄 New game state:', { 
      currentProblemIndex: newGameState.currentProblemIndex, 
      player1Answers: newGameState.player1Answers.length,
      player2Answers: newGameState.player2Answers.length,
      winner: newGameState.winner
    })
    
    setGameState(newGameState)
    
    // Save updated state to localStorage for sharing between players
    localStorage.setItem(`gameState_${matchId}`, JSON.stringify(newGameState))
    console.log('💾 Saved game state to localStorage for sharing:', {
      matchId,
      playerId,
      p1Answers: newGameState.player1Answers.length,
      p2Answers: newGameState.player2Answers.length,
      currentIndex: newGameState.currentProblemIndex
    })

    // Advance to next question immediately after answering (no waiting for other player)
    if (newGameState.currentProblemIndex < newGameState.problems.length - 1) {
      console.log('🚀 Advancing to next question immediately!')
      const advancedState = {
        ...newGameState,
        currentProblemIndex: newGameState.currentProblemIndex + 1
      }
      localStorage.setItem(`gameState_${matchId}`, JSON.stringify(advancedState))
      setGameState(advancedState)
      setLocalAnswerSubmitted(false)
      setHasAnsweredCurrentProblem(false)
    } else {
      console.log('🏁 Game finished!')
      const finishedState: MultiplayerGameState = {
        ...newGameState,
        gameEndTime: Date.now(),
        player1Finished: true,
        player2Finished: true,
        winner: newGameState.player1Score > newGameState.player2Score ? 'player1' : 
               newGameState.player2Score > newGameState.player1Score ? 'player2' : 'draw'
      }
      localStorage.setItem(`gameState_${matchId}`, JSON.stringify(finishedState))
      setGameState(finishedState)
      
      // Calculate and set the game result
      const result = calculateMultiplayerResult(finishedState)
      setGameResult(result)
      
      // Call onGameComplete to update match status in database
      console.log('🎮 Calling onGameComplete with result:', result)
      onGameComplete?.(result)
    }
    
    // Trigger a manual check for shared state updates
    setTimeout(() => {
      const sharedState = localStorage.getItem(`gameState_${matchId}`)
      if (sharedState) {
        const parsedState = JSON.parse(sharedState)
        console.log('🔄 Manual check after answer:', {
          sharedP1: parsedState.player1Answers.length,
          sharedP2: parsedState.player2Answers.length,
          localP1: newGameState.player1Answers.length,
          localP2: newGameState.player2Answers.length
        })
      }
    }, 100)
  }, [currentProblem, timeRemaining, playerId, onGameComplete, localAnswerSubmitted, gameState])

  const handleStartGame = () => {
    setShowInstructions(false)
  }

  if (showInstructions) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500 rounded-full">
              <Users className="h-8 w-8 text-black" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Multiplayer Math Blitz</CardTitle>
          <p className="text-gray-400 text-lg">Compete head-to-head with multiplication problems!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">How to Play</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span>10 synchronized multiplication problems</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Timer className="h-5 w-5 text-orange-500" />
                  <span>Timed questions with urgency</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Trophy className="h-5 w-5 text-orange-500" />
                  <span>Winner determined by score, then accuracy, then speed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <span>Real-time opponent progress tracking</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Scoring</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span>Easy (1-12×):</span>
                  <span className="text-green-400">10 pts + bonuses</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium (1-15×):</span>
                  <span className="text-yellow-400">15 pts + bonuses</span>
                </div>
                <div className="flex justify-between">
                  <span>Hard (1-20×):</span>
                  <span className="text-red-400">20 pts + bonuses</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed Bonus:</span>
                  <span className="text-blue-400">Up to 10 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Streak Bonus:</span>
                  <span className="text-purple-400">Every 3 correct</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleStartGame}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-6 text-lg"
          >
            Start Multiplayer Game!
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (gameResult) {
    const myResult = isPlayer1 ? gameResult.player1Result : gameResult.player2Result
    const opponentResult = isPlayer1 ? gameResult.player2Result : gameResult.player1Result
    const isWinner = gameResult.winner === playerId
    const isDraw = gameResult.winner === 'draw'

    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${isWinner ? 'bg-yellow-500' : isDraw ? 'bg-gray-500' : 'bg-red-500'}`}>
              {isWinner ? <Trophy className="h-8 w-8 text-black" /> : 
               isDraw ? <CheckCircle className="h-8 w-8 text-black" /> : 
               <XCircle className="h-8 w-8 text-black" />}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            {isWinner ? 'You Won!' : isDraw ? "It's a Draw!" : 'You Lost!'}
          </CardTitle>
          <p className="text-gray-400">
            {isWinner ? 'Congratulations on your victory!' : 
             isDraw ? 'Both players performed equally well!' : 
             'Better luck next time!'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Results Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg ${isPlayer1 && isWinner ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-gray-800/30'}`}>
              <h3 className="text-lg font-semibold text-white mb-4">Your Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Final Score:</span>
                  <span className="text-white font-bold text-xl">{myResult.score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Problems Solved:</span>
                  <span className="text-green-400 font-semibold">{myResult.problemsSolved}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-blue-400 font-semibold">{myResult.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Time:</span>
                  <span className="text-purple-400 font-semibold">{myResult.totalTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Best Streak:</span>
                  <span className="text-orange-400 font-semibold">{myResult.streak}</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg ${!isPlayer1 && isWinner ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-gray-800/30'}`}>
              <h3 className="text-lg font-semibold text-white mb-4">Opponent Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Final Score:</span>
                  <span className="text-white font-bold text-xl">{opponentResult.score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Problems Solved:</span>
                  <span className="text-green-400 font-semibold">{opponentResult.problemsSolved}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-blue-400 font-semibold">{opponentResult.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Time:</span>
                  <span className="text-purple-400 font-semibold">{opponentResult.totalTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Best Streak:</span>
                  <span className="text-orange-400 font-semibold">{opponentResult.streak}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Win Reason */}
          <Alert className="bg-gray-800/50 border-gray-700">
            <Trophy className="h-4 w-4" />
            <AlertDescription className="text-gray-300">
              Winner determined by: <span className="text-white font-semibold capitalize">{gameResult.winReason}</span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!currentProblem || !gameState) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
      <CardHeader className="text-center">
        {/* Game Progress */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <p className="text-gray-400">Problem {gameState.currentProblemIndex + 1}/10</p>
            <p className="text-2xl font-bold text-white">
              {isPlayer1 ? gameState.player1Score : gameState.player2Score} pts
            </p>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Multiplayer Math Blitz</h1>
            <p className="text-gray-400">Multiplication Challenge</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Opponent Progress</p>
            <p className="text-2xl font-bold text-orange-500">{opponentProgress}/10</p>
          </div>
        </div>
        
        {/* Timer */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Time Remaining</span>
            <span className={`text-lg font-bold ${timeRemaining <= 5 ? 'text-red-500' : timeRemaining <= 10 ? 'text-yellow-500' : 'text-green-500'}`}>
              {timeRemaining}s
            </span>
          </div>
          <Progress 
            value={(timeRemaining / currentProblem.timeLimit) * 100} 
            className="h-3"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Math Problem */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-8">{currentProblem.question}</h2>
          {localAnswerSubmitted && (
            <p className="text-green-400 text-lg mb-4">✓ Answer submitted! Moving to next question...</p>
          )}
          {/* Debug info */}
          {gameState && (
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div>
                Debug: Local P1:{gameState.player1Answers.length} P2:{gameState.player2Answers.length} 
                Index:{gameState.currentProblemIndex} | Shared P1:{sharedState?.player1Answers.length || 0} P2:{sharedState?.player2Answers.length || 0} 
                Index:{sharedState?.currentProblemIndex || 0} | Both:{bothPlayersAnswered ? 'Y' : 'N'} 
                BothAlt:{bothPlayersAnsweredAlt ? 'Y' : 'N'} Local:{localAnswerSubmitted ? 'Y' : 'N'}
              </div>
              <div className="space-x-2">
                <button 
                  onClick={() => {
                    const sharedState = localStorage.getItem(`gameState_${matchId}`)
                    if (sharedState) {
                      const parsedState = JSON.parse(sharedState)
                      console.log('🔍 Manual debug check:', parsedState)
                      setGameState(parsedState)
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  🔄 Force Sync
                </button>
                <button 
                  onClick={() => {
                    const sharedState = localStorage.getItem(`gameState_${matchId}`)
                    console.log('🔍 Current localStorage state:', sharedState)
                    if (sharedState) {
                      const parsedState = JSON.parse(sharedState)
                      console.log('🔍 Parsed localStorage state:', {
                        p1Answers: parsedState.player1Answers.length,
                        p2Answers: parsedState.player2Answers.length,
                        currentIndex: parsedState.currentProblemIndex
                      })
                    }
                  }}
                  className="text-green-400 hover:text-green-300 underline"
                >
                  📊 Show Storage
                </button>
                <button 
                  onClick={() => {
                    console.log('🔄 Resetting answer state...')
                    setLocalAnswerSubmitted(false)
                    setHasAnsweredCurrentProblem(false)
                  }}
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  🔄 Reset Answer
                </button>
                <button 
                  onClick={() => {
                    if (gameState && gameState.currentProblemIndex < gameState.problems.length - 1) {
                      console.log('🚀 Manually advancing question...')
                      const newGameState = {
                        ...gameState,
                        currentProblemIndex: gameState.currentProblemIndex + 1
                      }
                      setGameState(newGameState)
                      localStorage.setItem(`gameState_${matchId}`, JSON.stringify(newGameState))
                      setLocalAnswerSubmitted(false)
                      setHasAnsweredCurrentProblem(false)
                    }
                  }}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  ➡️ Next Question
                </button>
                <button 
                  onClick={() => {
                    console.log('🔄 Manually checking shared state...')
                    const stored = localStorage.getItem(`gameState_${matchId}`)
                    if (stored) {
                      const parsed = JSON.parse(stored)
                      console.log('🔍 Current shared state:', parsed)
                      setSharedState(parsed)
                    } else {
                      console.log('❌ No shared state found in localStorage')
                    }
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  🔄 Check Shared
                </button>
              </div>
            </div>
          )}
          
          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {currentProblem.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(option)}
                className="h-16 text-xl font-bold bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
                disabled={!isMyTurn || localAnswerSubmitted}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Difficulty</p>
            <p className="text-white font-semibold capitalize">{currentProblem.difficulty}</p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Base Points</p>
            <p className="text-white font-semibold">{currentProblem.points}</p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Time Limit</p>
            <p className="text-white font-semibold">{currentProblem.timeLimit}s</p>
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Your Score</p>
            <p className="text-white font-bold text-xl">{isPlayer1 ? gameState.player1Score : gameState.player2Score}</p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Opponent Score</p>
            <p className="text-white font-bold text-xl">
              {sharedState ? (isPlayer1 ? sharedState.player2Score : sharedState.player1Score) : '...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Debug: P1:{sharedState?.player1Score || 0} P2:{sharedState?.player2Score || 0}
            </p>
          </div>
        </div>

        {/* Opponent Status */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Users className="h-4 w-4" />
            <span>Opponent Progress: {opponentProgress}/10 problems</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
