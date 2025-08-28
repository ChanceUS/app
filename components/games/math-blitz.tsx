"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timer, Brain, Trophy, User } from "lucide-react"
import { generateMathQuestion, type MathBlitzQuestion } from "@/lib/game-logic"

interface MathBlitzProps {
  onGameEnd: (winner: "player1" | "player2" | "draw") => void
  isActive: boolean
  currentPlayer: "player1" | "player2"
  isMyTurn: boolean
  gameData?: any
  onMove?: (moveData: any) => void
}

interface PlayerState {
  score: number
  currentQuestion: MathBlitzQuestion | null
  answeredQuestions: number
  averageTime: number
}

export default function MathBlitz({ 
  onGameEnd, 
  isActive, 
  currentPlayer, 
  isMyTurn, 
  gameData, 
  onMove 
}: MathBlitzProps) {
  const [gameState, setGameState] = useState<{
    player1: PlayerState
    player2: PlayerState
    currentRound: number
    maxRounds: number
    gameWinner: "player1" | "player2" | "draw" | null
  }>({
    player1: { score: 0, currentQuestion: null, answeredQuestions: 0, averageTime: 0 },
    player2: { score: 0, currentQuestion: null, answeredQuestions: 0, averageTime: 0 },
    currentRound: 1,
    maxRounds: 10,
    gameWinner: null
  })

  const [timeLeft, setTimeLeft] = useState(30)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)

  // Initialize game state from game data or create new game
  useEffect(() => {
    if (gameData?.gameState) {
      setGameState(gameData.gameState)
    } else {
      // Initialize new game
      const newGameState = {
        player1: { score: 0, currentQuestion: null, answeredQuestions: 0, averageTime: 0 },
        player2: { score: 0, currentQuestion: null, answeredQuestions: 0, averageTime: 0 },
        currentRound: 1,
        maxRounds: 10,
        gameWinner: null
      }
      setGameState(newGameState)
      
      // Generate first question for current player
      if (isMyTurn) {
        generateNewQuestion()
      }
    }
  }, [gameData?.gameState, isMyTurn])

  // Timer countdown
  useEffect(() => {
    if (!isActive || !isMyTurn || gameState.gameWinner) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - mark as incorrect
          handleAnswer(-1) // -1 indicates timeout
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, isMyTurn, gameState.gameWinner])

  const generateNewQuestion = () => {
    const question = generateMathQuestion()
    const currentPlayerState = currentPlayer === "player1" ? "player1" : "player2"
    
    setGameState(prev => ({
      ...prev,
      [currentPlayerState]: {
        ...prev[currentPlayerState],
        currentQuestion: question
      }
    }))
    
    setTimeLeft(30)
    setQuestionStartTime(Date.now())
  }

  const handleAnswer = (selectedAnswer: number) => {
    if (!isMyTurn || !gameState.gameWinner) return

    const currentPlayerState = currentPlayer === "player1" ? "player1" : "player2"
    const currentQuestion = gameState[currentPlayerState].currentQuestion
    
    if (!currentQuestion) return

    const isCorrect = selectedAnswer === currentQuestion.answer
    const answerTime = Date.now() - questionStartTime
    const points = isCorrect ? Math.max(1, Math.floor(30 - answerTime / 1000)) : 0

    // Update player state
    const updatedGameState = {
      ...gameState,
      [currentPlayerState]: {
        ...gameState[currentPlayerState],
        score: gameState[currentPlayerState].score + points,
        answeredQuestions: gameState[currentPlayerState].answeredQuestions + 1,
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
        answer: selectedAnswer,
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
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-yellow-400 font-semibold">Opponent Score</div>
              <div className="text-white text-xl">{getOpponentState().score}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-cyan-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Brain className="mr-2 h-5 w-5 text-cyan-400" />
            Math Blitz
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-cyan-500/20 text-cyan-400">
              Round {gameState.currentRound}/{gameState.maxRounds}
            </Badge>
            <Badge className="bg-orange-500/20 text-orange-400">
              <Timer className="mr-1 h-3 w-3" />
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
            </div>
          </div>
          <div className={`p-4 rounded-lg ${currentPlayer === "player2" ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-gray-800/30"}`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Player 2</div>
              <div className="text-white font-medium">Opponent</div>
              <div className="text-yellow-400 text-xl font-bold">{gameState.player2.score}</div>
            </div>
          </div>
        </div>

        {/* Current Question */}
        {isMyTurn && getCurrentPlayerState().currentQuestion && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-white">
              {getCurrentPlayerState().currentQuestion?.question}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {getCurrentPlayerState().currentQuestion?.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="h-16 text-lg font-semibold bg-gray-800 hover:bg-gray-700 text-white"
                  disabled={!isActive}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Waiting for Opponent */}
        {!isMyTurn && (
          <div className="text-center space-y-4">
            <div className="text-xl text-gray-400">
              Waiting for opponent to answer...
            </div>
            <div className="flex justify-center">
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse mx-2"></div>
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse mx-2" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse mx-2" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}

        {/* Game Instructions */}
        <div className="text-center text-sm text-gray-400">
          Answer math questions quickly to earn points! Faster answers = more points.
        </div>
      </CardContent>
    </Card>
  )
}
