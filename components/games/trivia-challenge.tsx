"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Trophy, User, Clock } from "lucide-react"
import { getRandomTriviaQuestion, type TriviaQuestion } from "@/lib/game-logic"

interface TriviaChallengeProps {
  onGameEnd: (winner: "player1" | "player2" | "draw") => void
  isActive: boolean
  currentPlayer: "player1" | "player2"
  isMyTurn: boolean
  gameData?: any
  onMove?: (moveData: any) => void
}

interface PlayerState {
  score: number
  currentQuestion: TriviaQuestion | null
  answeredQuestions: number
  correctAnswers: number
  averageTime: number
}

export default function TriviaChallenge({ 
  onGameEnd, 
  isActive, 
  currentPlayer, 
  isMyTurn, 
  gameData, 
  onMove 
}: TriviaChallengeProps) {
  const [gameState, setGameState] = useState<{
    player1: PlayerState
    player2: PlayerState
    currentRound: number
    maxRounds: number
    gameWinner: "player1" | "player2" | "draw" | null
  }>({
    player1: { score: 0, currentQuestion: null, answeredQuestions: 0, correctAnswers: 0, averageTime: 0 },
    player2: { score: 0, currentQuestion: null, answeredQuestions: 0, correctAnswers: 0, averageTime: 0 },
    currentRound: 1,
    maxRounds: 8,
    gameWinner: null
  })

  const [timeLeft, setTimeLeft] = useState(45)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)

  // Initialize game state from game data or create new game
  useEffect(() => {
    console.log('🔄 Trivia component useEffect triggered with gameData:', gameData)

    // Check if we have saved game state (either in gameData.gameState or directly in gameData)
    const savedGameState = gameData?.gameState || gameData
    if (savedGameState && (savedGameState.player1 || savedGameState.player2 || savedGameState.currentRound)) {
      console.log('🔄 Loading trivia game state from database:', savedGameState)
      setGameState(savedGameState)
      
      // If the current player doesn't have a question, generate one
      const currentPlayerState = currentPlayer === "player1" ? "player1" : "player2"
      const currentQuestion = savedGameState[currentPlayerState]?.currentQuestion
      console.log('🔄 Current player:', currentPlayerState, 'Current question:', currentQuestion)
      
      if (!currentQuestion && !savedGameState.gameWinner) {
        console.log('🔄 No current question found for player, generating new one...')
        // Use setTimeout to ensure state is updated first
        setTimeout(() => {
          generateNewQuestion()
        }, 100)
      }
    } else {
      console.log('🔄 No saved game state, initializing new game...')
      // Initialize new game
      const newGameState = {
        player1: { score: 0, currentQuestion: null, answeredQuestions: 0, correctAnswers: 0, averageTime: 0 },
        player2: { score: 0, currentQuestion: null, answeredQuestions: 0, correctAnswers: 0, averageTime: 0 },
        currentRound: 1,
        maxRounds: 8,
        gameWinner: null
      }
      setGameState(newGameState)
      
      // Generate first question for current player
      generateNewQuestion()
    }
  }, [gameData, currentPlayer]) // Changed to depend on gameData directly

  // Timer countdown
  useEffect(() => {
    if (!isActive || gameState.gameWinner) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - mark as incorrect
          handleAnswer(-1) // -1 indicates timeout
          return 45
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, gameState.gameWinner]) // Removed isMyTurn dependency

  const generateNewQuestion = () => {
    const question = getRandomTriviaQuestion()
    const currentPlayerState = currentPlayer === "player1" ? "player1" : "player2"
    
    setGameState(prev => ({
      ...prev,
      [currentPlayerState]: {
        ...prev[currentPlayerState],
        currentQuestion: question
      }
    }))
    
    setTimeLeft(45)
    setQuestionStartTime(Date.now())
  }

  const handleAnswer = (selectedAnswerIndex: number) => {
    if (gameState.gameWinner) return

    const currentPlayerState = currentPlayer === "player1" ? "player1" : "player2"
    const currentQuestion = gameState[currentPlayerState].currentQuestion
    
    if (!currentQuestion) return

    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer
    const answerTime = Date.now() - questionStartTime
    const points = isCorrect ? Math.max(5, Math.floor(45 - answerTime / 1000)) : 0

    // Update player state
    const updatedGameState = {
      ...gameState,
      [currentPlayerState]: {
        ...gameState[currentPlayerState],
        score: gameState[currentPlayerState].score + points,
        answeredQuestions: gameState[currentPlayerState].answeredQuestions + 1,
        correctAnswers: gameState[currentPlayerState].correctAnswers + (isCorrect ? 1 : 0),
        averageTime: (gameState[currentPlayerState].averageTime + answerTime) / 2,
        currentQuestion: null
      },
      currentRound: gameState.currentRound + 1
    }

    setGameState(updatedGameState)

    // Check if game is over
    if (updatedGameState.currentRound > updatedGameState.maxRounds) {
      const winner = updatedGameState.player1.score > updatedGameState.player2.score 
        ? "player1" 
        : updatedGameState.player2.score > updatedGameState.player1.score 
        ? "player2" 
        : "draw"
      
      setGameState(prev => ({ ...prev, gameWinner: winner }))
      onGameEnd(winner)
    }

    // Send move to opponent
    if (onMove) {
      onMove({
        gameState: updatedGameState,
        answer: selectedAnswerIndex,
        isCorrect,
        points,
        answerTime,
        player: currentPlayer,
        timestamp: new Date().toISOString()
      })
    }

    // Generate next question for opponent
    if (updatedGameState.currentRound <= updatedGameState.maxRounds) {
      setTimeout(() => {
        if (!updatedGameState.gameWinner) {
          generateNewQuestion()
        }
      }, 1000)
    }
  }

  const getCurrentPlayerState = () => {
    return currentPlayer === "player1" ? gameState.player1 : gameState.player2
  }

  const getOpponentState = () => {
    return currentPlayer === "player1" ? gameState.player2 : gameState.player1
  }

  if (gameState.gameWinner) {
    return (
      <Card className="bg-gray-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white text-center">
            <Trophy className="mr-2 h-6 w-6 text-yellow-400 inline" />
            Game Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-2xl font-bold text-white">
            {gameState.gameWinner === "draw" ? "It's a Draw!" : 
             gameState.gameWinner === currentPlayer ? "You Won!" : "You Lost!"}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-cyan-400 font-semibold">Your Score</div>
              <div className="text-white text-xl">{getCurrentPlayerState().score}</div>
              <div className="text-gray-400 text-xs">
                {getCurrentPlayerState().correctAnswers}/{getCurrentPlayerState().answeredQuestions} correct
              </div>
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-yellow-400 font-semibold">Opponent Score</div>
              <div className="text-white text-xl">{getOpponentState().score}</div>
              <div className="text-gray-400 text-xs">
                {getOpponentState().correctAnswers}/{getOpponentState().answeredQuestions} correct
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Brain className="mr-2 h-5 w-5 text-purple-400" />
            Trivia Challenge
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-purple-500/20 text-purple-400">
              Round {gameState.currentRound}/{gameState.maxRounds}
            </Badge>
            <Badge className="bg-orange-500/20 text-orange-400">
              <Clock className="mr-1 h-3 w-3" />
              {timeLeft}s
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Game Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${currentPlayer === "player1" ? "bg-cyan-500/20 border border-cyan-500/30" : "bg-gray-800/30"}`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Player 1</div>
              <div className="text-white font-medium">You</div>
              <div className="text-cyan-400 text-xl font-bold">{gameState.player1.score}</div>
              <div className="text-gray-400 text-xs">
                {gameState.player1.correctAnswers}/{gameState.player1.answeredQuestions}
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${currentPlayer === "player2" ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-gray-800/30"}`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Player 2</div>
              <div className="text-white font-medium">Opponent</div>
              <div className="text-yellow-400 text-xl font-bold">{gameState.player2.score}</div>
              <div className="text-gray-400 text-xs">
                {gameState.player2.correctAnswers}/{gameState.player2.answeredQuestions}
              </div>
            </div>
          </div>
        </div>

        {/* Current Question */}
        {getCurrentPlayerState().currentQuestion && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge className="bg-purple-500/20 text-purple-400 mb-2">
                {getCurrentPlayerState().currentQuestion?.category}
              </Badge>
              <div className="text-xl font-bold text-white">
                {getCurrentPlayerState().currentQuestion?.question}
              </div>
            </div>
            
            <div className="space-y-3">
              {getCurrentPlayerState().currentQuestion?.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full h-14 text-left px-4 bg-gray-800 hover:bg-gray-700 text-white justify-start"
                  disabled={!isActive}
                >
                  <span className="mr-3 text-purple-400 font-mono">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}


        {/* Game Instructions */}
        <div className="text-center text-sm text-gray-400">
          Answer trivia questions correctly to earn points! Faster answers = more points.
        </div>
      </CardContent>
    </Card>
  )
}
