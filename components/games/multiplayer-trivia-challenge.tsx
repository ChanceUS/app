"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Timer, Brain, Users, CheckCircle } from "lucide-react"
import { 
  TriviaQuestion,
  TriviaAnswer,
  MultiplayerTriviaState,
  TriviaResult,
  getRandomTriviaQuestionFromDB
} from "@/lib/game-logic"

interface MultiplayerTriviaChallengeProps {
  matchId: string
  currentUserId: string
  player1Id: string
  player2Id: string
  onGameComplete?: (result: TriviaResult) => void
}

const TOTAL_QUESTIONS = 8
const QUESTION_TIME_LIMIT = 45

export default function MultiplayerTriviaChallenge({ 
  matchId, 
  currentUserId, 
  player1Id, 
  player2Id,
  onGameComplete 
}: MultiplayerTriviaChallengeProps) {
  const [gameState, setGameState] = useState<MultiplayerTriviaState | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [gameResult, setGameResult] = useState<TriviaResult | null>(null)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [localAnswerSubmitted, setLocalAnswerSubmitted] = useState(false)
  const [myCurrentQuestionIndex, setMyCurrentQuestionIndex] = useState(0)
  const [bothPlayersReady, setBothPlayersReady] = useState(false)
  const [matchReady, setMatchReady] = useState(false)
  
  const isPlayer1 = currentUserId === player1Id
  
  // Save game state to database
  const saveGameStateToDatabase = useCallback(async (state: MultiplayerTriviaState, finalResult?: TriviaResult) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: matchData } = await supabase
        .from('matches')
        .select('game_data')
        .eq('id', matchId)
        .single()
      
      const currentGameData = matchData?.game_data || {}
      
      const updateData: any = {
        gameState: state
      }
      
      if (finalResult) {
        updateData.finalResult = finalResult
      }
      
      await supabase
        .from('matches')
        .update({
          game_data: {
            ...currentGameData,
            ...updateData
          }
        })
        .eq('id', matchId)
    } catch (error) {
      console.error('Error saving game state:', error)
    }
  }, [matchId])

  // Load game state from database
  useEffect(() => {
    const loadGameState = async () => {
      try {
        console.log('🔄 Loading trivia game state for match:', matchId)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data: matchData } = await supabase
          .from('matches')
          .select('game_data')
          .eq('id', matchId)
          .single()
        
        console.log('🔄 Match data retrieved:', { hasGameData: !!matchData?.game_data?.gameState })
        
        if (matchData?.game_data?.gameState) {
          const loadedState = matchData.game_data.gameState as MultiplayerTriviaState
          console.log('🔄 Loaded trivia game state from database:', {
            p1Answers: loadedState.player1Answers.length,
            p2Answers: loadedState.player2Answers.length,
            p1Score: loadedState.player1Score,
            p2Score: loadedState.player2Score
          })
          
          // Only update state if we don't have a state yet, or if the loaded state has more progress
          const shouldUpdate = !gameState || 
            loadedState.player1Answers.length > gameState.player1Answers.length || 
            loadedState.player2Answers.length > gameState.player2Answers.length
            
          console.log('🔄 Should update state?', {
            hasGameState: !!gameState,
            p1Progress: loadedState.player1Answers.length,
            p2Progress: loadedState.player2Answers.length,
            shouldUpdate
          })
          
          if (shouldUpdate) {
            setGameState(loadedState)
            
            // Set player's current question index
            const myAnswers = isPlayer1 ? loadedState.player1Answers : loadedState.player2Answers
            console.log('✅ Updating player question index to:', myAnswers.length)
            setMyCurrentQuestionIndex(myAnswers.length)
          } else {
            console.log('⏭️ Skipping state update - no progress change')
          }
          
          // Check if both finished to show results
          if (loadedState.player1Finished && loadedState.player2Finished && matchData.game_data.finalResult) {
            setGameResult(matchData.game_data.finalResult)
            setMatchReady(true)
            return
          }
          
          // Update opponent progress
          setOpponentProgress(isPlayer1 ? loadedState.player2Answers.length : loadedState.player1Answers.length)
          
          // Check if match is ready
          if (player1Id && player2Id) {
            setMatchReady(true)
            setBothPlayersReady(true)
          }
        } else if (!gameState) {
          // Only initialize if we don't have any state yet
          // Initialize new game
          const questions: TriviaQuestion[] = []
          for (let i = 0; i < TOTAL_QUESTIONS; i++) {
            const q = await getRandomTriviaQuestionFromDB()
            if (q) {
              questions.push({ ...q, timeLimit: QUESTION_TIME_LIMIT })
            } else {
              // If question failed to load, skip it
              console.warn(`Failed to load question ${i + 1}, skipping`)
            }
          }
          
          // If we have no questions at all, fall back to generating 8 random questions
          if (questions.length === 0) {
            console.error('Failed to load any questions, using fallback')
            // Generate fallback questions
            for (let i = 0; i < TOTAL_QUESTIONS; i++) {
              const { getRandomTriviaQuestion } = await import('@/lib/game-logic')
              const q = getRandomTriviaQuestion()
              questions.push({ ...q, timeLimit: QUESTION_TIME_LIMIT })
            }
          }
          
          console.log(`Loaded ${questions.length} questions for game`)
          
          const initialState: MultiplayerTriviaState = {
            questions,
            currentQuestionIndex: 0,
            player1Score: 0,
            player2Score: 0,
            player1Answers: [],
            player2Answers: [],
            player1Finished: false,
            player2Finished: false,
            gameStartTime: Date.now()
          }
          
          setGameState(initialState)
          setMyCurrentQuestionIndex(0)
          
          if (player1Id && player2Id) {
            setMatchReady(true)
            setBothPlayersReady(true)
            
            // Save initial state
            await saveGameStateToDatabase(initialState)
          }
        }
      } catch (error) {
        console.error('Error loading game state:', error)
      }
    }
    
    loadGameState()
    
    // Poll for updates every 1 second
    const interval = setInterval(loadGameState, 1000)
    return () => clearInterval(interval)
  }, [matchId, isPlayer1, player1Id, player2Id, saveGameStateToDatabase])

  // Update current question when index changes
  useEffect(() => {
    if (!gameState || !gameState.questions) return
    
    // Only react to the current player's answers
    const currentPlayerAnswers = isPlayer1 ? gameState.player1Answers : gameState.player2Answers
    const nextQuestionIndex = currentPlayerAnswers.length
    
    // Don't update question if player has finished
    if (nextQuestionIndex >= TOTAL_QUESTIONS) {
      return
    }
    
    // Set the current question based on the player's answer count
    if (nextQuestionIndex < gameState.questions.length) {
      const question = gameState.questions[nextQuestionIndex]
      setCurrentQuestion(question)
      setTimeRemaining(question.timeLimit || QUESTION_TIME_LIMIT)
      setLocalAnswerSubmitted(false)
      setMyCurrentQuestionIndex(nextQuestionIndex)
    }
  }, [isPlayer1 ? gameState?.player1Answers?.length : gameState?.player2Answers?.length, gameState, isPlayer1])

  // Timer countdown
  useEffect(() => {
    if (!matchReady || !currentQuestion || timeRemaining <= 0 || gameResult) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAnswer(-1) // Timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [matchReady, currentQuestion, timeRemaining, gameResult])

  // Handle answer submission
  const handleAnswer = async (selectedAnswerIndex: number) => {
    if (!currentQuestion || !gameState || localAnswerSubmitted) return
    if (gameState.player1Finished && isPlayer1) return
    if (gameState.player2Finished && !isPlayer1) return
    
    // Check if player has already answered all questions
    const currentPlayerAnswers = isPlayer1 ? gameState.player1Answers : gameState.player2Answers
    if (currentPlayerAnswers.length >= TOTAL_QUESTIONS) {
      console.log('Player already finished all questions')
      return
    }
    
    setLocalAnswerSubmitted(true)
    
    const startTime = Date.now() - (QUESTION_TIME_LIMIT - timeRemaining) * 1000
    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer
    const answerTime = Date.now() - startTime
    const points = isCorrect ? Math.max(5, Math.floor(QUESTION_TIME_LIMIT - answerTime / 1000)) : 0
    
    const answer: TriviaAnswer = {
      questionId: currentQuestion.id || currentQuestion.question,
      answer: selectedAnswerIndex,
      isCorrect,
      timeSpent: answerTime,
      timestamp: Date.now()
    }
    
    // Update game state
    const updatedAnswers = isPlayer1 
      ? [...gameState.player1Answers, answer]
      : [...gameState.player2Answers, answer]
    
    const newState: MultiplayerTriviaState = {
      ...gameState,
      player1Answers: isPlayer1 ? updatedAnswers : gameState.player1Answers,
      player2Answers: !isPlayer1 ? updatedAnswers : gameState.player2Answers,
      player1Score: isPlayer1 ? gameState.player1Score + points : gameState.player1Score,
      player2Score: !isPlayer1 ? gameState.player2Score + points : gameState.player2Score,
      player1Finished: isPlayer1 && updatedAnswers.length >= TOTAL_QUESTIONS,
      player2Finished: !isPlayer1 && updatedAnswers.length >= TOTAL_QUESTIONS
    }
    
    setGameState(newState)
    
    // Check if both players finished
    if (newState.player1Finished && newState.player2Finished) {
      const result = calculateTriviaResult(newState)
      setGameResult(result)
      await saveGameStateToDatabase(newState, result)
      
      if (onGameComplete) {
        // Pass the winner string, not the full result
        onGameComplete(result.winner)
      }
    } else {
      await saveGameStateToDatabase(newState)
    }
    
    // Question will update automatically via useEffect when state changes
  }

  // Calculate trivia result
  const calculateTriviaResult = (state: MultiplayerTriviaState): TriviaResult => {
    const p1Correct = state.player1Answers.filter(a => a.isCorrect).length
    const p2Correct = state.player2Answers.filter(a => a.isCorrect).length
    const p1TotalTime = state.player1Answers.reduce((sum, a) => sum + a.timeSpent, 0)
    const p2TotalTime = state.player2Answers.reduce((sum, a) => sum + a.timeSpent, 0)
    
    return {
      player1Result: {
        score: state.player1Score,
        questionsAnswered: state.player1Answers.length,
        correctAnswers: p1Correct,
        accuracy: state.player1Answers.length > 0 ? (p1Correct / state.player1Answers.length) * 100 : 0,
        totalTime: p1TotalTime,
        averageTime: state.player1Answers.length > 0 ? p1TotalTime / state.player1Answers.length : 0
      },
      player2Result: {
        score: state.player2Score,
        questionsAnswered: state.player2Answers.length,
        correctAnswers: p2Correct,
        accuracy: state.player2Answers.length > 0 ? (p2Correct / state.player2Answers.length) * 100 : 0,
        totalTime: p2TotalTime,
        averageTime: state.player2Answers.length > 0 ? p2TotalTime / state.player2Answers.length : 0
      },
      winner: state.player1Score > state.player2Score ? 'player1' 
        : state.player2Score > state.player1Score ? 'player2' 
        : 'draw'
    }
  }

  // Continuous check for completion (polling-based)
  useEffect(() => {
    if (!gameState || gameResult) return
    
    const checkCompletion = async () => {
      const p1Finished = gameState.player1Answers.length >= TOTAL_QUESTIONS
      const p2Finished = gameState.player2Answers.length >= TOTAL_QUESTIONS
      
      if (p1Finished && p2Finished && !gameResult) {
        console.log('✅ Both players finished, calculating result...')
        const result = calculateTriviaResult(gameState)
        setGameResult(result)
        await saveGameStateToDatabase(gameState, result)
        
        if (onGameComplete) {
          // Pass the winner string, not the full result
          onGameComplete(result.winner)
        }
      }
    }
    
    checkCompletion()
  }, [gameState, gameResult, onGameComplete, saveGameStateToDatabase])

  // Show loading
  if (!gameState) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="py-12 text-center">
          <div className="inline-block animate-spin">
            <Brain className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-gray-400 mt-4">Loading game...</p>
        </CardContent>
      </Card>
    )
  }

  // Show results if both players finished
  if (gameResult) {
    const myResult = isPlayer1 ? gameResult.player1Result : gameResult.player2Result
    const opponentResult = isPlayer1 ? gameResult.player2Result : gameResult.player1Result
    const iWon = gameResult.winner === (isPlayer1 ? 'player1' : 'player2')
    
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-center text-white flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Game Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">
              {iWon ? 'You Won! 🎉' : gameResult.winner === 'draw' ? "It's a Draw!" : 'You Lost'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="text-cyan-400 font-semibold mb-2">Your Score</div>
              <div className="text-white text-3xl font-bold">{myResult.score}</div>
              <div className="text-gray-400 text-sm mt-2">
                {myResult.correctAnswers}/{myResult.questionsAnswered} correct ({Math.round(myResult.accuracy)}%)
              </div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="text-yellow-400 font-semibold mb-2">Opponent Score</div>
              <div className="text-white text-3xl font-bold">{opponentResult.score}</div>
              <div className="text-gray-400 text-sm mt-2">
                {opponentResult.correctAnswers}/{opponentResult.questionsAnswered} correct ({Math.round(opponentResult.accuracy)}%)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show waiting screen if one player finished
  const myAnswerCount = isPlayer1 ? gameState.player1Answers.length : gameState.player2Answers.length
  const opponentAnswerCount = isPlayer1 ? gameState.player2Answers.length : gameState.player1Answers.length
  const myFinished = myAnswerCount >= TOTAL_QUESTIONS
  const opponentFinished = opponentAnswerCount >= TOTAL_QUESTIONS
  
  if (myFinished && !opponentFinished) {
    const opponentName = isPlayer1 ? 'Player 2' : 'Player 1'
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="py-12 text-center">
          <Trophy className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">You've Finished!</h2>
          <p className="text-gray-400">
            Waiting for {opponentName} to finish their questions...
          </p>
          <div className="mt-6">
            <Progress value={100} className="w-64 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Your score: {isPlayer1 ? gameState.player1Score : gameState.player2Score} points</p>
            <p className="text-sm text-gray-400">Opponent progress: {opponentProgress}/{TOTAL_QUESTIONS}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show main game
  if (!matchReady) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
        <CardContent className="py-12 text-center">
          <p className="text-gray-400">Waiting for game to start...</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) return null

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400">Question {myCurrentQuestionIndex + 1}/{TOTAL_QUESTIONS}</p>
            <p className="text-2xl font-bold text-white">
              {isPlayer1 ? gameState.player1Score : gameState.player2Score} pts
            </p>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Multiplayer Trivia</h1>
            <p className="text-gray-400">Trivia Challenge</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Opponent Progress</p>
            <p className="text-2xl font-bold text-orange-500">{opponentProgress}/{TOTAL_QUESTIONS}</p>
            <p className="text-sm text-gray-400 mt-1">
              Score: {isPlayer1 ? gameState.player2Score : gameState.player1Score} pts
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Timer className="h-5 w-5 text-orange-500" />
            <span className="text-lg font-bold text-white">{timeRemaining}s</span>
          </div>
          <Progress 
            value={(timeRemaining / QUESTION_TIME_LIMIT) * 100} 
            className="h-2"
          />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge className="bg-purple-500/20 text-purple-400 mb-2">
              {currentQuestion.category}
            </Badge>
            <div className="text-2xl font-bold text-white mt-4">
              {currentQuestion.question}
            </div>
          </div>
          
          {/* Answer options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full h-16 text-left px-4 bg-gray-800 hover:bg-gray-700 text-white justify-start text-lg"
                disabled={localAnswerSubmitted}
              >
                <span className="mr-3 text-purple-400 font-mono">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-400">
          Answer correctly to earn points! Faster answers = more points.
        </div>
      </CardContent>
    </Card>
  )
}

