"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  const [hasSubmittedFinalResult, setHasSubmittedFinalResult] = useState(false)

  const isPlayer1 = currentUserId === player1Id
  const playerId = isPlayer1 ? 'player1' : 'player2'
  
  // Check if both players have answered the current question using shared state
  const [sharedState, setSharedState] = useState<any>(null)
  const lastSharedStateRef = useRef<string>('')
  
  useEffect(() => {
    const checkSharedState = () => {
      const stored = localStorage.getItem(`gameState_${matchId}`)
      if (stored) {
        // Only update if the stored state is actually different
        if (stored !== lastSharedStateRef.current) {
          lastSharedStateRef.current = stored
          const parsed = JSON.parse(stored)
          
          console.log('🔄 Shared state updated:', {
            p1Answers: parsed.player1Answers.length,
            p2Answers: parsed.player2Answers.length,
            currentIndex: parsed.currentProblemIndex
          })
          
          setSharedState(parsed)
        }
      }
    }
    checkSharedState()
    const interval = setInterval(checkSharedState, 200) // Reduced frequency
    return () => clearInterval(interval)
  }, [matchId])

  const bothPlayersAnswered = sharedState && currentProblem && 
    sharedState.player1Answers.length >= sharedState.currentProblemIndex + 1 &&
    sharedState.player2Answers.length >= sharedState.currentProblemIndex + 1
  
  // Alternative check: if both players have answered at least the current problem
  const bothPlayersAnsweredAlt = sharedState && currentProblem && 
    sharedState.player1Answers.length > sharedState.currentProblemIndex &&
    sharedState.player2Answers.length > sharedState.currentProblemIndex

  // Final result synchronization - ensure both players see the same result
  useEffect(() => {
    if (!gameState || !gameState.player1Finished || !gameState.player2Finished) return

    // Check if we have a shared final result
    const finalResultKey = `finalResult_${matchId}`
    const storedFinalResult = localStorage.getItem(finalResultKey)
    
    if (storedFinalResult) {
      const finalResult = JSON.parse(storedFinalResult)
      console.log('🔄 Using synchronized final result:', finalResult)
      setGameResult(finalResult)
    } else if (gameResult) {
      // Only store the result if we haven't already stored one
      // This prevents both players from overwriting each other's results
      const existingResult = localStorage.getItem(finalResultKey)
      if (!existingResult) {
        console.log('💾 Storing final result for synchronization:', gameResult)
        localStorage.setItem(finalResultKey, JSON.stringify(gameResult))
      } else {
        console.log('🔄 Final result already exists, using existing one')
        const existingFinalResult = JSON.parse(existingResult)
        setGameResult(existingFinalResult)
      }
    }
  }, [gameResult, matchId])

  // Additional synchronization check - poll for final result if game is finished
  useEffect(() => {
    if (!gameState || !gameState.player1Finished || !gameState.player2Finished) return

    const checkForFinalResult = () => {
      const finalResultKey = `finalResult_${matchId}`
      const storedFinalResult = localStorage.getItem(finalResultKey)
      
      if (storedFinalResult) {
        const finalResult = JSON.parse(storedFinalResult)
        console.log('🔄 Polling found final result:', finalResult)
        
        // Force update the game result to ensure synchronization
        setGameResult(finalResult)
        
        // Also update the game state to match the final result
        if (finalResult.player1Result && finalResult.player2Result && gameState) {
          console.log('🔄 Updating game state with final result data')
          setGameState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              player1Answers: finalResult.player1Result.answers || prev.player1Answers,
              player2Answers: finalResult.player2Result.answers || prev.player2Answers,
              player1Score: finalResult.player1Result.score || prev.player1Score,
              player2Score: finalResult.player2Result.score || prev.player2Score
            }
          })
        }
      }
    }

    // Check immediately
    checkForFinalResult()
    
    // Poll every 500ms for final result
    const interval = setInterval(checkForFinalResult, 500)
    
    return () => clearInterval(interval)
  }, [matchId, gameResult])
  
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
      
      console.log('🎮 Game initialized with timer:', initialState.problems[0].timeLimit)
    }
  }, [matchId])

  // Listen for storage events (when localStorage changes in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `gameState_${matchId}` && e.newValue) {
        console.log('🔄 Storage event detected, checking for updates...')
        // The pollForUpdates function will handle this
      }
      
      // Also listen for final result synchronization
      if (e.key === `finalResult_${matchId}` && e.newValue) {
        const finalResult = JSON.parse(e.newValue)
        console.log('🔄 Final result sync received via storage event:', finalResult)
        setGameResult(finalResult)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [matchId])

  // Timer countdown
  useEffect(() => {
    if (!gameState || !currentProblem || gameState.player1Finished && gameState.player2Finished) return

    // Start timer immediately when game state is available
    console.log('⏰ Starting timer for problem:', currentProblem.id, 'Time limit:', currentProblem.timeLimit)
    setTimeRemaining(currentProblem.timeLimit)

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        console.log('⏰ Timer tick:', prev, 'localAnswerSubmitted:', localAnswerSubmitted)
        if (prev <= 1) {
          // Time's up - submit no answer
          console.log('⏰ Time up! Submitting no answer')
          if (!localAnswerSubmitted) {
            console.log('⏰ Calling handleAnswer(-1) for timeout')
          handleAnswer(-1) // -1 indicates no answer/timeout
          } else {
            console.log('⏰ Already answered, skipping timeout submission')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentProblem]) // Only depend on currentProblem, not gameState

  // Update opponent progress from game state (which includes merged data)
  useEffect(() => {
    if (!gameState) return
    
    const opponentAnswers = isPlayer1 ? gameState.player2Answers : gameState.player1Answers
    const opponentScore = isPlayer1 ? gameState.player2Score : gameState.player1Score
    
    setOpponentProgress(opponentAnswers.length)
    
    console.log('🔄 Opponent progress updated from game state:', {
      isPlayer1,
      opponentAnswers: opponentAnswers.length,
      opponentScore,
      player1Score: gameState.player1Score,
      player2Score: gameState.player2Score,
      p1AnswersLength: gameState.player1Answers?.length || 0,
      p2AnswersLength: gameState.player2Answers?.length || 0
    })
  }, [gameState, isPlayer1])

  // Update current problem when game state changes
  useEffect(() => {
    if (!gameState) return
    
    console.log('🔄 Game state changed, updating current problem:', {
      currentProblemIndex: gameState.currentProblemIndex,
      problemsLength: gameState.problems.length
    })
    
    // Check if game is finished first
    if (gameState.player1Finished && gameState.player2Finished) {
      console.log('🏁 Game finished, not updating problem')
      return
    }
    
    // Update current problem if index changed and game is not finished
    if (gameState.currentProblemIndex < gameState.problems.length) {
      const newProblem = gameState.problems[gameState.currentProblemIndex]
      if (newProblem) {
        console.log('➡️ Updating to new problem:', newProblem.id)
        setCurrentProblem(newProblem)
        setTimeRemaining(newProblem.timeLimit)
        setHasAnsweredCurrentProblem(false) // Reset answer flag for new question
        setLocalAnswerSubmitted(false) // Reset local answer flag for new question
      }
    } else {
      console.log('⚠️ Problem index out of bounds:', {
        currentIndex: gameState.currentProblemIndex,
        problemsLength: gameState.problems.length,
        p1Finished: gameState.player1Finished,
        p2Finished: gameState.player2Finished
      })
    }
  }, [gameState])

  // Simple polling to sync state between players
  useEffect(() => {
    const pollForUpdates = () => {
      const sharedState = localStorage.getItem(`gameState_${matchId}`)
      if (sharedState) {
        const parsedState = JSON.parse(sharedState)
        
        // Don't update sharedState here to avoid infinite loops
        // The main polling useEffect will handle sharedState updates
        
        // Stop polling if game is finished to prevent infinite loops
        if (parsedState.player1Finished && parsedState.player2Finished) {
          console.log('🏁 Game finished, stopping polling to prevent infinite loops')
          return
        }
        
        // Sync the state and handle game completion
        setGameState(currentState => {
          if (!currentState) return currentState
          
          if (parsedState.currentProblemIndex !== currentState.currentProblemIndex ||
              parsedState.player1Answers.length !== currentState.player1Answers.length ||
              parsedState.player2Answers.length !== currentState.player2Answers.length ||
              parsedState.player1Score !== currentState.player1Score ||
              parsedState.player2Score !== currentState.player2Score ||
              parsedState.player1Finished !== currentState.player1Finished ||
              parsedState.player2Finished !== currentState.player2Finished) {
            
            console.log('🔄 Syncing state from shared:', {
              sharedIndex: parsedState.currentProblemIndex,
              localIndex: currentState.currentProblemIndex,
              sharedP1: parsedState.player1Answers.length,
              localP1: currentState.player1Answers.length,
              sharedP2: parsedState.player2Answers.length,
              localP2: currentState.player2Answers.length,
              sharedP1Score: parsedState.player1Score,
              localP1Score: currentState.player1Score,
              sharedP2Score: parsedState.player2Score,
              localP2Score: currentState.player2Score,
              gameFinished: parsedState.player1Finished && parsedState.player2Finished
            })
            
            // Game completion is handled in handleAnswer function
            // This polling function only handles state synchronization
            
            // Return the merged state to ensure opponent data is preserved
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
    
    console.log('🔄 New game state after submitPlayerAnswer:', { 
      currentProblemIndex: newGameState.currentProblemIndex, 
      player1Answers: newGameState.player1Answers.length,
      player2Answers: newGameState.player2Answers.length,
      winner: newGameState.winner,
      problemsLength: newGameState.problems.length,
      isFinished: newGameState.currentProblemIndex >= newGameState.problems.length
    })
    
    // Save updated state to localStorage for sharing between players
    // Always merge with existing shared state to preserve opponent's data
    const existingSharedState = localStorage.getItem(`gameState_${matchId}`)
    let stateToSave = newGameState
    
    if (existingSharedState) {
      try {
        const parsedExisting = JSON.parse(existingSharedState)
        console.log('🔄 Existing shared state found:', {
          p1Answers: parsedExisting.player1Answers?.length || 0,
          p2Answers: parsedExisting.player2Answers?.length || 0,
          p1Score: parsedExisting.player1Score || 0,
          p2Score: parsedExisting.player2Score || 0
        })
        
        // Always merge both players' data to ensure nothing is lost
        stateToSave = {
          ...newGameState,
          // Preserve opponent's answers and score
          player1Answers: isPlayer1 ? newGameState.player1Answers : (parsedExisting.player1Answers || []),
          player2Answers: !isPlayer1 ? newGameState.player2Answers : (parsedExisting.player2Answers || []),
          player1Score: isPlayer1 ? newGameState.player1Score : (parsedExisting.player1Score || 0),
          player2Score: !isPlayer1 ? newGameState.player2Score : (parsedExisting.player2Score || 0)
        }
        
        console.log('🔄 Merged state created:', {
          p1Answers: stateToSave.player1Answers.length,
          p2Answers: stateToSave.player2Answers.length,
          p1Score: stateToSave.player1Score,
          p2Score: stateToSave.player2Score,
          isPlayer1
        })
      } catch (error) {
        console.error('Error parsing existing shared state:', error)
        // If parsing fails, just use the new state
        stateToSave = newGameState
      }
    }
    
    localStorage.setItem(`gameState_${matchId}`, JSON.stringify(stateToSave))
    console.log('💾 Saved merged game state to localStorage for sharing:', {
      matchId,
      playerId,
      p1Answers: stateToSave.player1Answers.length,
      p2Answers: stateToSave.player2Answers.length,
      currentIndex: stateToSave.currentProblemIndex
    })
    
    // Update local game state with merged data to show opponent's progress
    setGameState(stateToSave)
    console.log('🔄 Game state updated in component with merged data')

    // Reset local answer flag for next question
    setLocalAnswerSubmitted(false)
    setHasAnsweredCurrentProblem(false)
    
    // Check if this player is finished (using the merged state)
    console.log('🔍 Checking if player finished:', {
      currentIndex: stateToSave.currentProblemIndex,
      problemsLength: stateToSave.problems.length,
      isFinished: stateToSave.currentProblemIndex >= stateToSave.problems.length,
      p1Finished: stateToSave.player1Finished,
      p2Finished: stateToSave.player2Finished
    })
    
    // Force mark player as finished if we're past the last question
    if (stateToSave.currentProblemIndex >= stateToSave.problems.length) {
      console.log('🏁 Player is past last question, forcing finish state')
      if (isPlayer1) {
        stateToSave.player1Finished = true
      } else {
        stateToSave.player2Finished = true
      }
    }
    
    if (stateToSave.currentProblemIndex >= stateToSave.problems.length) {
      console.log('🏁 This player finished!')
      const finishedState: MultiplayerGameState = {
        ...stateToSave, // Use the merged state instead of newGameState
        gameEndTime: Date.now(),
        // Only mark the current player as finished
        player1Finished: isPlayer1 ? true : (stateToSave.player1Finished || false),
        player2Finished: !isPlayer1 ? true : (stateToSave.player2Finished || false),
        winner: 'draw' // Will be calculated properly by calculateMultiplayerResult
      }
      localStorage.setItem(`gameState_${matchId}`, JSON.stringify(finishedState))
      setGameState(finishedState)
      
      // Only calculate and submit final result if BOTH players have finished
      if (finishedState.player1Finished && finishedState.player2Finished) {
        console.log('🏁 Both players finished! Calculating final result...')
        
        // Check if result already exists in localStorage
        const finalResultKey = `finalResult_${matchId}`
        const existingResult = localStorage.getItem(finalResultKey)
        
        if (existingResult) {
          // Use existing result
          const result = JSON.parse(existingResult)
          console.log('🔄 Using existing result from localStorage:', result)
          setGameResult(result)
        } else {
          // Calculate new result
          const result = calculateMultiplayerResult(finishedState)
          console.log('🎯 Calculated new result:', result)
          
          // Store the result for synchronization
          localStorage.setItem(finalResultKey, JSON.stringify(result))
          setGameResult(result)
          
          // Only call onGameComplete if we haven't already submitted the final result
          const submissionKey = `finalResultSubmitted_${matchId}`
          const currentSubmission = localStorage.getItem(submissionKey)
          
          if (!currentSubmission && !hasSubmittedFinalResult) {
            try {
              localStorage.setItem(submissionKey, playerId)
              const verification = localStorage.getItem(submissionKey)
              if (verification === playerId) {
                console.log('🎮 Calling onGameComplete with result:', result)
                setHasSubmittedFinalResult(true)
                onGameComplete?.(result)
              } else {
                console.log('🔄 Another player got the lock first, skipping onGameComplete')
              }
            } catch (error) {
              console.log('🔄 Failed to set submission flag, skipping onGameComplete')
            }
          } else {
            console.log('🔄 Final result already submitted, skipping onGameComplete')
          }
        }
    } else {
        console.log('⏳ Waiting for opponent to finish...', {
          p1Finished: finishedState.player1Finished,
          p2Finished: finishedState.player2Finished,
          isPlayer1
        })
      }
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
  }, [currentProblem, playerId, onGameComplete, localAnswerSubmitted])

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
                  <span className="text-gray-400">Composite Score:</span>
                  <span className="text-white font-bold text-xl">{myResult.compositeScore || myResult.score}</span>
                </div>
                {myResult.scoreBreakdown && (
                  <div className="space-y-1 text-xs bg-gray-800/30 p-2 rounded">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base: {myResult.scoreBreakdown.baseScore}</span>
                      <span className="text-green-400">+Acc: {myResult.scoreBreakdown.accuracyBonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-400">+Speed: {myResult.scoreBreakdown.speedBonus}</span>
                      <span className="text-purple-400">+Cons: {myResult.scoreBreakdown.consistencyBonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">+Complete: {myResult.scoreBreakdown.completionBonus}</span>
                      <span className="text-white font-semibold">= {myResult.compositeScore}</span>
                    </div>
                  </div>
                )}
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
                  <span className="text-gray-400">Composite Score:</span>
                  <span className="text-white font-bold text-xl">{opponentResult.compositeScore || opponentResult.score}</span>
                </div>
                {opponentResult.scoreBreakdown && (
                  <div className="space-y-1 text-xs bg-gray-800/30 p-2 rounded">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base: {opponentResult.scoreBreakdown.baseScore}</span>
                      <span className="text-green-400">+Acc: {opponentResult.scoreBreakdown.accuracyBonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-400">+Speed: {opponentResult.scoreBreakdown.speedBonus}</span>
                      <span className="text-purple-400">+Cons: {opponentResult.scoreBreakdown.consistencyBonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">+Complete: {opponentResult.scoreBreakdown.completionBonus}</span>
                      <span className="text-white font-semibold">= {opponentResult.compositeScore}</span>
                    </div>
                  </div>
                )}
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
              Winner determined by: <span className="text-white font-semibold capitalize">
                {gameResult.winReason === 'composite' ? 'Overall Performance' : gameResult.winReason}
              </span>
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

  // Don't render questions if both players are finished OR if we're past the last question
  if (gameState.player1Finished && gameState.player2Finished) {
    console.log('🏁 Game finished, not rendering questions')
    return null
  }
  
  // Also don't render if we're past the last question (safety check)
  if (gameState.currentProblemIndex >= gameState.problems.length) {
    console.log('⚠️ Past last question, not rendering questions:', {
      currentIndex: gameState.currentProblemIndex,
      problemsLength: gameState.problems.length,
      p1Finished: gameState.player1Finished,
      p2Finished: gameState.player2Finished
    })
    return null
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
            <p className="text-sm text-gray-400 mt-1">
              Score: {isPlayer1 ? gameState.player2Score : gameState.player1Score} pts
            </p>
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
              {isPlayer1 ? gameState.player2Score : gameState.player1Score}
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
