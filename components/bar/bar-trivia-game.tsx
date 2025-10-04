"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Trophy, Clock, Users, Target, Zap } from "lucide-react"
import { getRandomTriviaQuestion, type TriviaQuestion } from "@/lib/game-logic"

interface BarTriviaGameProps {
  sessionId: string
  participantId: string
  displayName: string
  maxQuestions: number
  timePerQuestion: number
  onGameEnd: (finalScore: number, questionsAnswered: number, correctAnswers: number) => void
  hasCompletedGame?: boolean
  currentScore?: number
}

interface GameState {
  currentQuestion: TriviaQuestion | null
  questionIndex: number
  score: number
  questionsAnswered: number
  correctAnswers: number
  averageResponseTime: number
  isGameActive: boolean
  gameStartTime: number | null
  currentQuestionStartTime: number | null
  timeRemaining: number
  gameEnded: boolean
  isTransitioning: boolean
}

export default function BarTriviaGame({
  sessionId,
  participantId,
  displayName,
  maxQuestions,
  timePerQuestion,
  onGameEnd,
  hasCompletedGame = false,
  currentScore = 0
}: BarTriviaGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: null,
    questionIndex: 0,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    averageResponseTime: 0,
    isGameActive: false,
    gameStartTime: null,
    currentQuestionStartTime: null,
    timeRemaining: timePerQuestion,
    gameEnded: false,
    isTransitioning: false
  })

  // Timer effect
  useEffect(() => {
    if (!gameState.isGameActive || gameState.gameEnded || !gameState.currentQuestion) return

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up - mark as incorrect
          handleAnswer(-1)
          return prev
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.isGameActive, gameState.gameEnded, gameState.currentQuestion])

  const startGame = () => {
    // Check if user has already completed the game
    if (hasCompletedGame) {
      console.log("❌ User has already completed this game")
      return
    }
    
    console.log("startGame called")
    setGameState(prev => ({
      ...prev,
      isGameActive: true,
      gameStartTime: Date.now(),
      currentQuestionStartTime: Date.now(),
      timeRemaining: timePerQuestion,
      isTransitioning: false
    }))
    console.log("Game state set, calling generateNewQuestion")
    generateNewQuestion()
  }

  const generateNewQuestion = () => {
    console.log("generateNewQuestion called")
    const question = getRandomTriviaQuestion()
    console.log("Generated question:", question)
    setGameState(prev => ({
      ...prev,
      currentQuestion: question,
      currentQuestionStartTime: Date.now(),
      timeRemaining: timePerQuestion,
      isTransitioning: false
    }))
    console.log("Question state updated")
  }

  const handleAnswer = (selectedAnswerIndex: number) => {
    if (!gameState.isGameActive || gameState.gameEnded || !gameState.currentQuestion) return

    const isCorrect = selectedAnswerIndex === gameState.currentQuestion.correctAnswer
    const responseTime = gameState.currentQuestionStartTime 
      ? (Date.now() - gameState.currentQuestionStartTime) / 1000 
      : timePerQuestion

    // Calculate points based on speed and correctness
    let points = 0
    if (isCorrect) {
      const speedBonus = Math.max(0, (timePerQuestion - responseTime) / timePerQuestion)
      points = Math.floor(10 + (speedBonus * 20)) // Base 10 points + up to 20 bonus
    }

    const newScore = gameState.score + points
    const newQuestionsAnswered = gameState.questionsAnswered + 1
    const newCorrectAnswers = gameState.correctAnswers + (isCorrect ? 1 : 0)
    const newQuestionIndex = gameState.questionIndex + 1
    const newAverageResponseTime = gameState.averageResponseTime === 0 
      ? responseTime 
      : (gameState.averageResponseTime + responseTime) / 2

    console.log("🎮 BarTriviaGame: Answer submitted:", {
      isCorrect,
      points,
      newScore,
      newQuestionsAnswered,
      newCorrectAnswers,
      newQuestionIndex,
      maxQuestions
    })

    setGameState(prev => ({
      ...prev,
      score: newScore,
      questionsAnswered: newQuestionsAnswered,
      correctAnswers: newCorrectAnswers,
      averageResponseTime: newAverageResponseTime,
      questionIndex: newQuestionIndex,
      currentQuestion: null,
      timeRemaining: timePerQuestion,
      isTransitioning: true
    }))

    // Update score in real-time after each question (not just at the end)
    updateLiveScore(newScore, newQuestionsAnswered, newCorrectAnswers)

    // Check if game is over using the new question index
    if (newQuestionIndex >= maxQuestions) {
      console.log("🎮 BarTriviaGame: Game ending - reached max questions")
      endGame(newScore, newQuestionsAnswered, newCorrectAnswers)
    } else {
      // Generate next question after a short delay
      setTimeout(() => {
        generateNewQuestion()
      }, 800)
    }
  }

  // Function to update live score after each question
  const updateLiveScore = async (score: number, questionsAnswered: number, correctAnswers: number) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Find the participant record
      const { data: existingParticipant } = await supabase
        .from("bar_trivia_participants")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", authUser.id)
        .single()

      if (existingParticipant) {
        // Update score in real-time
        await supabase
          .from("bar_trivia_participants")
          .update({
            score: score,
            questions_answered: questionsAnswered,
            correct_answers: correctAnswers
          })
          .eq("id", existingParticipant.id)

        console.log("🔄 Live score updated:", { score, questionsAnswered, correctAnswers })
      }
    } catch (error) {
      console.error("❌ Error updating live score:", error)
    }
  }

  const endGame = (finalScore: number, questionsAnswered: number, correctAnswers: number) => {
    console.log("🎮 BarTriviaGame: endGame called with:", { finalScore, questionsAnswered, correctAnswers })
    
    setGameState(prev => ({
      ...prev,
      isGameActive: false,
      gameEnded: true,
      currentQuestion: null
    }))
    
    console.log("🎮 BarTriviaGame: Calling onGameEnd callback...")
    onGameEnd(finalScore, questionsAnswered, correctAnswers)
    console.log("🎮 BarTriviaGame: onGameEnd callback completed")
  }

  const getProgressPercentage = () => {
    return (gameState.questionIndex / maxQuestions) * 100
  }

  const getAccuracy = () => {
    return gameState.questionsAnswered > 0 
      ? Math.round((gameState.correctAnswers / gameState.questionsAnswered) * 100)
      : 0
  }

  if (gameState.gameEnded) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-center flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Game Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-3xl font-bold text-white">
            Great job, {displayName}!
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{gameState.score}</div>
              <div className="text-sm text-white/80">Final Score</div>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{getAccuracy()}%</div>
              <div className="text-sm text-white/80">Accuracy</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-white/60">Questions Answered</div>
              <div className="text-white font-medium">{gameState.questionsAnswered}/{maxQuestions}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-white/60">Correct Answers</div>
              <div className="text-white font-medium">{gameState.correctAnswers}</div>
            </div>
          </div>

          {gameState.score > 0 && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-400 font-medium mb-1">
                🎉 Congratulations!
              </div>
              <div className="text-green-300 text-sm">
                You've earned a drink reward! Show this to the bar staff to claim your free drink.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // If user has already completed the game, show completion screen
  if (hasCompletedGame) {
    return (
      <Card className="bg-gray-900/50 border-green-500/50">
        <CardHeader>
          <CardTitle className="text-white text-center flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-green-400" />
            Game Already Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">You've already played, {displayName}!</div>
            <div className="text-white/90">
              You completed this trivia session with a score of <span className="text-yellow-400 font-bold">{currentScore}</span>.
            </div>
          </div>
          
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 font-medium mb-1">
              ✅ Session Complete
            </div>
            <div className="text-green-300 text-sm">
              You can only play once per session. Check the leaderboard to see how you ranked!
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!gameState.isGameActive) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-center flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-purple-300" />
            Bar Trivia Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">Welcome, {displayName}!</div>
            <div className="text-white/90">
              Get ready to test your knowledge and win drinks!
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-white/80">Questions</div>
              <div className="text-white font-medium">{maxQuestions}</div>
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-white/80">Time per Question</div>
              <div className="text-white font-medium">{timePerQuestion}s</div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-400" />
              Answer quickly for bonus points
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Beat the high score to win a drink
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Show your reward to bar staff
            </div>
          </div>

          <Button
            onClick={startGame}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 shadow-lg"
          >
            Start Trivia Game
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-purple-500/40 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-300" />
            Bar Trivia
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600/60 text-purple-200 border-purple-400/50">
              Question {gameState.questionIndex + 1}/{maxQuestions}
            </Badge>
            <Badge className="bg-orange-600/60 text-orange-200 border-orange-400/50">
              <Clock className="mr-1 h-3 w-3" />
              {gameState.timeRemaining}s
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/80">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-300">{gameState.score}</div>
            <div className="text-xs text-white/80">Score</div>
          </div>
          <div className="bg-gray-800/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-300">{getAccuracy()}%</div>
            <div className="text-xs text-white/80">Accuracy</div>
          </div>
          <div className="bg-gray-800/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-300">{gameState.correctAnswers}</div>
            <div className="text-xs text-white/80">Correct</div>
          </div>
        </div>

        {/* Current Question */}
        {gameState.currentQuestion && !gameState.isTransitioning && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge className="bg-purple-600/60 text-purple-200 border-purple-400/50 mb-3">
                {gameState.currentQuestion.category}
              </Badge>
              <div className="text-xl font-bold text-white leading-relaxed">
                {gameState.currentQuestion.question}
              </div>
            </div>
            
            <div className="space-y-3">
              {gameState.currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full h-14 text-left px-4 bg-gray-800 hover:bg-gray-700 text-white justify-start border border-gray-600 hover:border-gray-500 transition-all"
                  disabled={!gameState.isGameActive}
                >
                  <span className="mr-3 text-purple-300 font-mono text-lg">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-base">{option}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State During Transition */}
        {gameState.isTransitioning && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <div className="text-lg font-medium text-white">Loading next question...</div>
            </div>
          </div>
        )}

        {/* Player Info - Only show when not transitioning */}
        {!gameState.isTransitioning && (
          <div className="text-center text-sm text-white/60">
            Playing as <span className="text-white font-medium">{displayName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
